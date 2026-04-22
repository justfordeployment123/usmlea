import type { NextFunction, Request, Response } from 'express'
import { ROLE_TYPES, type RoleType } from '../config/env.js'
import { HttpError } from '../lib/httpError.js'
import { supabaseServiceClient, verifySupabaseJwt } from '../lib/supabase.js'

function getBearerToken(headerValue?: string) {
  if (!headerValue) return null
  const [scheme, token] = headerValue.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export async function authenticateRequest(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req.header('authorization'))
    if (!token) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Missing bearer token')
    }

    const payload = await verifySupabaseJwt(token)

    const { data: profile, error } = await supabaseServiceClient
      .from('profiles')
      .select('role')
      .eq('id', payload.sub)
      .single()

    if (error || !profile) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Profile not found for authenticated user')
    }

    const profileRole = String(profile.role ?? '').toLowerCase()
    if (!ROLE_TYPES.includes(profileRole as RoleType)) {
      throw new HttpError(403, 'FORBIDDEN', 'Invalid role configured for user profile')
    }

    req.auth = {
      userId: payload.sub,
      email: payload.email ?? null,
      role: profileRole as RoleType,
    }

    return next()
  } catch (error) {
    if (error instanceof HttpError) return next(error)
    return next(new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired access token'))
  }
}

export function requireRole(role: RoleType) {
  return function roleMiddleware(req: Request, _res: Response, next: NextFunction) {
    if (!req.auth) {
      return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication required'))
    }

    if (req.auth.role !== role) {
      return next(new HttpError(403, 'FORBIDDEN', `${role} role required`))
    }

    return next()
  }
}
