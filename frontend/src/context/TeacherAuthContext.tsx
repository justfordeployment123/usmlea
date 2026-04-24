/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react'
import { safeParseJson } from '../services/errorUtils'
import { loginTeacher, registerTeacher } from '../services/lmsApi'
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
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.email === 'string' &&
    typeof t.status === 'string'
  )
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

  const persist = (t: Teacher, token: string) => {
    const s: TeacherSession = { accessToken: token }
    localStorage.setItem(TEACHER_AUTH_KEY, JSON.stringify({ teacher: t, session: s }))
    setTeacher(t)
    setSession(s)
  }

  const login = async (email: string, password: string): Promise<Teacher> => {
    const response = await loginTeacher(email.trim().toLowerCase(), password)
    persist(response.teacher, response.accessToken)
    return response.teacher
  }

  const register = async (payload: RegisterTeacherPayload): Promise<Teacher> => {
    const newTeacher = await registerTeacher(payload)
    persist(newTeacher, `mock-teacher-token-${newTeacher.id}`)
    return newTeacher
  }

  const logout = () => {
    localStorage.removeItem(TEACHER_AUTH_KEY)
    setTeacher(null)
    setSession(null)
  }

  const refreshTeacher = (updated: Teacher) => {
    if (!session) return
    localStorage.setItem(TEACHER_AUTH_KEY, JSON.stringify({ teacher: updated, session }))
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
