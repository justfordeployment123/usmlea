import { Router } from 'express'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'

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
