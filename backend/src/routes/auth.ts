import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { HttpError } from '../lib/httpError.js'
import { logError } from '../lib/logger.js'
import { createSupabaseAnonClient, supabaseAnonClient, supabaseServiceClient } from '../lib/supabase.js'

const registerStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  medicalSchool: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  newPassword: z.string().min(8),
})

export const authRouter = Router()

function isSupabaseEmailRateLimitError(message: string | undefined): boolean {
  if (!message) return false
  const normalized = message.toLowerCase()
  return normalized.includes('rate limit') || normalized.includes('security purposes')
}

function getStudentResetRedirectUrl(): string {
  return `${env.FRONTEND_URL.replace(/\/+$/, '')}/student/reset-password`
}

authRouter.post('/auth/student/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerStudentSchema.parse(req.body)
    const normalizedEmail = parsed.email.trim().toLowerCase()

    const { data, error } = await supabaseAnonClient.auth.signUp({
      email: normalizedEmail,
      password: parsed.password,
      options: {
        data: {
          full_name: parsed.fullName,
          medical_school: parsed.medicalSchool ?? null,
        },
      },
    })

    if (error) {
      if (isSupabaseEmailRateLimitError(error.message)) {
        throw new HttpError(429, 'EMAIL_RATE_LIMIT_EXCEEDED', 'Too many signup emails. Please wait 60 seconds and retry.')
      }
      throw new HttpError(400, 'SIGNUP_FAILED', error.message)
    }

    if (!data.user) {
      throw new HttpError(400, 'SIGNUP_FAILED', 'Unable to create student user')
    }

    const { error: profileError } = await supabaseServiceClient.from('profiles').upsert({
      id: data.user.id,
      email: normalizedEmail,
      full_name: parsed.fullName,
      role: 'student',
      medical_school: parsed.medicalSchool ?? null,
    })

    if (profileError) {
      throw new HttpError(500, 'PROFILE_CREATE_FAILED', profileError.message)
    }

    let session = data.session

    if (!session) {
      const { data: signInData, error: signInError } = await supabaseAnonClient.auth.signInWithPassword({
        email: normalizedEmail,
        password: parsed.password,
      })

      if (signInError || !signInData.session) {
        throw new HttpError(
          409,
          'EMAIL_CONFIRMATION_REQUIRED',
          'Account created. Please verify your email before signing in.',
        )
      }

      session = signInData.session
    }

    return res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'student',
        onboarded: false,
      },
      session,
    })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/auth/student/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.parse(req.body)

    const { data, error } = await supabaseAnonClient.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    })

    if (error || !data.user || !data.session) {
      throw new HttpError(401, 'LOGIN_FAILED', error?.message ?? 'Invalid credentials')
    }

    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('role, onboarded')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      throw new HttpError(403, 'ROLE_MISMATCH', 'This account is not a student account')
    }

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'student',
        onboarded: profile.onboarded ?? false,
      },
      session: data.session,
    })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/auth/admin/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.parse(req.body)

    const { data, error } = await supabaseAnonClient.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    })

    if (error || !data.user || !data.session) {
      throw new HttpError(401, 'LOGIN_FAILED', error?.message ?? 'Invalid credentials')
    }

    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      throw new HttpError(403, 'ROLE_MISMATCH', 'This account is not an admin account')
    }

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
      },
      session: data.session,
    })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/auth/student/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = forgotPasswordSchema.parse(req.body)
    const normalizedEmail = parsed.email.trim().toLowerCase()

    const { error } = await supabaseAnonClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: getStudentResetRedirectUrl(),
    })

    if (error) {
      logError('Student forgot-password request failed', {
        email: normalizedEmail,
        code: error.code,
        message: error.message,
      })
    }

    return res.status(200).json({
      message: 'If an account exists, a password reset link has been sent.',
    })
  } catch (error) {
    return next(error)
  }
})

authRouter.post('/auth/student/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = resetPasswordSchema.parse(req.body)

    const requestClient = createSupabaseAnonClient()
    const { error: sessionError } = await requestClient.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    })

    if (sessionError) {
      throw new HttpError(401, 'INVALID_RECOVERY_LINK', 'Reset link is invalid or expired. Please request a new one.')
    }

    const { error: updateError } = await requestClient.auth.updateUser({
      password: parsed.newPassword,
    })

    if (updateError) {
      if (isSupabaseEmailRateLimitError(updateError.message)) {
        throw new HttpError(429, 'EMAIL_RATE_LIMIT_EXCEEDED', 'Too many password reset attempts. Please wait 60 seconds and retry.')
      }
      throw new HttpError(400, 'PASSWORD_RESET_FAILED', updateError.message)
    }

    return res.status(200).json({
      message: 'Password has been reset successfully. Please sign in with your new password.',
    })
  } catch (error) {
    return next(error)
  }
})
