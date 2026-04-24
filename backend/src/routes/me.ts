import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { HttpError } from '../lib/httpError.js'
import { supabaseServiceClient } from '../lib/supabase.js'

export const meRouter = Router()

meRouter.get('/me', authenticateRequest, (req, res) => {
  return res.status(200).json({
    user: req.auth,
  })
})

meRouter.get('/student/me', authenticateRequest, requireRole('student'), (req, res) => {
  return res.status(200).json({
    user: req.auth,
    scope: 'student',
  })
})

meRouter.get('/admin/me', authenticateRequest, requireRole('admin'), (req, res) => {
  return res.status(200).json({
    user: req.auth,
    scope: 'admin',
  })
})

meRouter.post('/student/complete-onboarding', authenticateRequest, requireRole('student'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabaseServiceClient
      .from('profiles')
      .update({ onboarded: true })
      .eq('id', req.auth!.userId)

    if (error) {
      throw new HttpError(500, 'ONBOARDING_UPDATE_FAILED', error.message)
    }

    return res.status(200).json({ message: 'Onboarding completed.' })
  } catch (error) {
    return next(error)
  }
})
