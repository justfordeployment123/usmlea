/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react'
import { safeParseJson } from '../services/errorUtils'
import { loginAffiliate } from '../services/affiliateApi'
import type { AffiliateUser } from '../types/affiliate'

interface AffiliateSession {
  accessToken: string
}

interface PersistedAffiliateAuth {
  user: AffiliateUser
  session: AffiliateSession
}

interface AffiliateAuthContextType {
  affiliate: AffiliateUser | null
  session: AffiliateSession | null
  login: (email: string, password: string) => Promise<AffiliateUser>
  logout: () => void
}

const AffiliateAuthContext = createContext<AffiliateAuthContextType | null>(null)
const AFFILIATE_AUTH_KEY = 'nextgen.affiliate.auth'

function isAffiliateUser(value: unknown): value is AffiliateUser {
  if (!value || typeof value !== 'object') return false
  const c = value as Partial<AffiliateUser>
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.email === 'string' &&
    typeof c.referralCode === 'string' &&
    typeof c.commissionPct === 'number'
  )
}

function isPersistedAffiliateAuth(value: unknown): value is PersistedAffiliateAuth {
  if (!value || typeof value !== 'object') return false
  const c = value as Partial<PersistedAffiliateAuth>
  if (!isAffiliateUser(c.user)) return false
  if (!c.session || typeof c.session !== 'object') return false
  return typeof (c.session as Partial<AffiliateSession>).accessToken === 'string'
}

function loadInitialAffiliate(): { user: AffiliateUser | null; session: AffiliateSession | null } {
  const persisted = safeParseJson<unknown>(localStorage.getItem(AFFILIATE_AUTH_KEY))
  if (isPersistedAffiliateAuth(persisted)) {
    return { user: persisted.user, session: persisted.session }
  }
  return { user: null, session: null }
}

export const AffiliateAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = loadInitialAffiliate()
  const [affiliate, setAffiliate] = useState<AffiliateUser | null>(initial.user)
  const [session, setSession] = useState<AffiliateSession | null>(initial.session)

  const login = async (email: string, password: string): Promise<AffiliateUser> => {
    const response = await loginAffiliate(email.trim().toLowerCase(), password)
    const newSession: AffiliateSession = { accessToken: response.accessToken }
    localStorage.setItem(AFFILIATE_AUTH_KEY, JSON.stringify({ user: response.user, session: newSession }))
    setAffiliate(response.user)
    setSession(newSession)
    return response.user
  }

  const logout = () => {
    localStorage.removeItem(AFFILIATE_AUTH_KEY)
    setAffiliate(null)
    setSession(null)
  }

  return (
    <AffiliateAuthContext.Provider value={{ affiliate, session, login, logout }}>
      {children}
    </AffiliateAuthContext.Provider>
  )
}

export const useAffiliateAuth = () => {
  const ctx = useContext(AffiliateAuthContext)
  if (!ctx) throw new Error('useAffiliateAuth must be used within AffiliateAuthProvider')
  return ctx
}
