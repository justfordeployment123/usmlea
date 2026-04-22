import { createClient } from '@supabase/supabase-js'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../config/env.js'

export function createSupabaseAnonClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const supabaseAnonClient = createSupabaseAnonClient()

export const supabaseServiceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const jwks = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))

export interface VerifiedSupabaseJwt {
  sub: string
  email?: string
  role?: string
}

export async function verifySupabaseJwt(token: string): Promise<VerifiedSupabaseJwt> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `${env.SUPABASE_URL}/auth/v1`,
    audience: env.SUPABASE_JWT_AUDIENCE,
  })

  return {
    sub: String(payload.sub),
    email: payload.email ? String(payload.email) : undefined,
    role: payload.role ? String(payload.role) : undefined,
  }
}
