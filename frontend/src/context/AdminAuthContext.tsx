import React, { createContext, useContext, useState } from 'react'

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

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem('adminUser')
    return stored ? JSON.parse(stored) : null
  })

  const login = (email: string, password: string): boolean => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = { name: 'Admin', email }
      localStorage.setItem('adminUser', JSON.stringify(adminUser))
      setAdmin(adminUser)
      return true
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
