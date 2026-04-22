import type { RoleType } from '../config/env.js'

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
        email: string | null
        role: RoleType
      }
    }
  }
}

export {}
