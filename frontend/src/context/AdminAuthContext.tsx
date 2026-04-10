/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react'
import { safeParseJson } from '../services/errorUtils'
import { captureException, logWarn } from '../services/observability'

interface AdminUser {
  name: string
  email: string
}

interface AdminAuthContextType {
  admin: AdminUser | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

const ADMIN_EMAIL = 'admin@nextgen.com'
const ADMIN_PASSWORD = 'admin123'

function isAdminUser(value: unknown): value is AdminUser {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AdminUser>
  return typeof candidate.name === 'string' && typeof candidate.email === 'string'
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const parsed = safeParseJson<unknown>(localStorage.getItem('adminUser'))
    if (!parsed) return null
    if (isAdminUser(parsed)) return parsed

    logWarn('Ignored malformed persisted admin user')
    localStorage.removeItem('adminUser')
    return null
  })

  const login = (email: string, password: string): boolean => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      try {
        const adminUser = { name: 'Admin', email }
        localStorage.setItem('adminUser', JSON.stringify(adminUser))
        setAdmin(adminUser)
        return true
      } catch (error) {
        captureException(error, { feature: 'admin-auth', action: 'login' })
        return false
      }
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('adminUser')
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
