import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.js'
import { healthRouter } from './routes/health.js'
import { meRouter } from './routes/me.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN }))
  app.use(express.json({ limit: '1mb' }))
  app.use(morgan('dev'))

  app.use('/api/v1', healthRouter)
  app.use('/api/v1', authRouter)
  app.use('/api/v1', meRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
