import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.js'
import { healthRouter } from './routes/health.js'
import { meRouter } from './routes/me.js'
import { lmsPublicRouter } from './routes/lmsPublic.js'
import { lmsAdminRouter } from './routes/lmsAdmin.js'
import { lmsTeacherRouter } from './routes/lmsTeacher.js'
import { lmsEditorRouter } from './routes/lmsEditor.js'
import { lmsStudentRouter } from './routes/lmsStudent.js'
import { lmsPaymentsRouter, webhookHandler } from './routes/lmsPayments.js'
import { communityRouter } from './routes/community.js'
import { zoomWebhookHandler } from './routes/zoomWebhook.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim())
  app.use(cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins }))

  // Stripe webhook must receive raw body — register before express.json()
  app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler)

  app.use(express.json({ limit: '1mb' }))
  app.use(morgan('dev'))

  app.use('/api/v1', healthRouter)
  app.use('/api/v1', authRouter)
  app.use('/api/v1', meRouter)
  app.use('/api/v1', lmsPublicRouter)
  app.use('/api/v1', lmsAdminRouter)
  app.use('/api/v1', lmsTeacherRouter)
  app.use('/api/v1', lmsEditorRouter)
  app.use('/api/v1', lmsStudentRouter)
  app.use('/api/v1', lmsPaymentsRouter)
  app.use('/api/v1', communityRouter)

  // Zoom webhook — fires after a cloud recording is ready
  app.post('/api/v1/webhooks/zoom', zoomWebhookHandler)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
