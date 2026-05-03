/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react'
import { safeParseJson } from '../services/errorUtils'
import { loginTeacher, registerTeacher, refreshSession, isSessionExpired } from '../services/lmsApi'
import type { Teacher } from '../types/lms'
import type { RegisterTeacherPayload } from '../types/lms'

interface TeacherSession {
  accessToken: string
}

interface PersistedTeacherAuth {
  teacher: Teacher
  session: TeacherSession
}

interface TeacherAuthContextType {
  teacher: Teacher | null
  session: TeacherSession | null
  login: (email: string, password: string) => Promise<Teacher>
  register: (payload: RegisterTeacherPayload) => Promise<Teacher>
  logout: () => void
  refreshTeacher: (updated: Teacher) => void
}

const TeacherAuthContext = createContext<TeacherAuthContextType | null>(null)
const TEACHER_AUTH_KEY = 'nextgen.teacher.auth'

function isTeacher(value: unknown): value is Teacher {
  if (!value || typeof value !== 'object') return false
  const t = value as Partial<Teacher>
  return typeof t.id === 'string' && typeof t.name === 'string' && typeof t.email === 'string' && typeof t.status === 'string'
}

function isPersisted(value: unknown): value is PersistedTeacherAuth {
  if (!value || typeof value !== 'object') return false
  const c = value as Partial<PersistedTeacherAuth>
  if (!isTeacher(c.teacher)) return false
  if (!c.session || typeof c.session !== 'object') return false
  return typeof (c.session as Partial<TeacherSession>).accessToken === 'string'
}

function loadInitial(): { teacher: Teacher | null; session: TeacherSession | null } {
  const persisted = safeParseJson<unknown>(localStorage.getItem(TEACHER_AUTH_KEY))
  if (isPersisted(persisted)) return { teacher: persisted.teacher, session: persisted.session }
  return { teacher: null, session: null }
}

export const TeacherAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = loadInitial()
  const [teacher, setTeacher] = useState<Teacher | null>(initial.teacher)
  const [session, setSession] = useState<TeacherSession | null>(initial.session)

  useEffect(() => {
    if (!teacher) return
    const tryRefresh = async () => {
      if (!isSessionExpired(TEACHER_AUTH_KEY)) return
      const newToken = await refreshSession(TEACHER_AUTH_KEY)
      if (newToken) {
        setSession({ accessToken: newToken })
      } else {
        localStorage.removeItem(TEACHER_AUTH_KEY)
        setTeacher(null)
        setSession(null)
      }
    }
    tryRefresh()
    const id = setInterval(tryRefresh, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [teacher])

  const persist = (t: Teacher, token: string) => {
    const raw = localStorage.getItem(TEACHER_AUTH_KEY)
    const existing = raw ? JSON.parse(raw) : {}
    localStorage.setItem(TEACHER_AUTH_KEY, JSON.stringify({ ...existing, teacher: t, session: { ...existing.session, accessToken: token } }))
    setTeacher(t)
    setSession({ accessToken: token })
  }

  const login = async (email: string, password: string): Promise<Teacher> => {
    const response = await loginTeacher(email.trim().toLowerCase(), password)
    persist(response.teacher, response.accessToken)
    return response.teacher
  }

  const register = async (payload: RegisterTeacherPayload): Promise<Teacher> => {
    const response = await registerTeacher(payload)
    setTeacher(response.teacher)
    return response.teacher
  }

  const logout = () => {
    localStorage.removeItem(TEACHER_AUTH_KEY)
    setTeacher(null)
    setSession(null)
  }

  const refreshTeacher = (updated: Teacher) => {
    if (!session) return
    const raw = localStorage.getItem(TEACHER_AUTH_KEY)
    const existing = raw ? JSON.parse(raw) : {}
    localStorage.setItem(TEACHER_AUTH_KEY, JSON.stringify({ ...existing, teacher: updated }))
    setTeacher(updated)
  }

  return (
    <TeacherAuthContext.Provider value={{ teacher, session, login, register, logout, refreshTeacher }}>
      {children}
    </TeacherAuthContext.Provider>
  )
}

export const useTeacherAuth = () => {
  const ctx = useContext(TeacherAuthContext)
  if (!ctx) throw new Error('useTeacherAuth must be used within TeacherAuthProvider')
  return ctx
}
