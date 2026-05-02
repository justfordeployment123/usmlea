/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react'
import { safeParseJson } from '../services/errorUtils'
import { loginEditor, refreshSession, isSessionExpired } from '../services/lmsApi'
import type { Editor } from '../types/lms'

interface EditorSession {
  accessToken: string
}

interface PersistedEditorAuth {
  editor: Editor
  session: EditorSession
}

interface EditorAuthContextType {
  editor: Editor | null
  session: EditorSession | null
  login: (email: string, password: string) => Promise<Editor>
  logout: () => void
}

const EditorAuthContext = createContext<EditorAuthContextType | null>(null)
const EDITOR_AUTH_KEY = 'nextgen.editor.auth'

function isEditor(value: unknown): value is Editor {
  if (!value || typeof value !== 'object') return false
  const e = value as Partial<Editor>
  return typeof e.id === 'string' && typeof e.name === 'string' && typeof e.email === 'string'
}

function isPersisted(value: unknown): value is PersistedEditorAuth {
  if (!value || typeof value !== 'object') return false
  const c = value as Partial<PersistedEditorAuth>
  if (!isEditor(c.editor)) return false
  if (!c.session || typeof c.session !== 'object') return false
  return typeof (c.session as Partial<EditorSession>).accessToken === 'string'
}

function loadInitial(): { editor: Editor | null; session: EditorSession | null } {
  const persisted = safeParseJson<unknown>(localStorage.getItem(EDITOR_AUTH_KEY))
  if (isPersisted(persisted)) return { editor: persisted.editor, session: persisted.session }
  return { editor: null, session: null }
}

export const EditorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = loadInitial()
  const [editor, setEditor] = useState<Editor | null>(initial.editor)
  const [session, setSession] = useState<EditorSession | null>(initial.session)

  useEffect(() => {
    if (!editor) return
    if (!isSessionExpired(EDITOR_AUTH_KEY)) return
    refreshSession(EDITOR_AUTH_KEY).then(newToken => {
      if (newToken) {
        setSession({ accessToken: newToken })
      } else {
        localStorage.removeItem(EDITOR_AUTH_KEY)
        setEditor(null)
        setSession(null)
      }
    })
  }, [])

  const login = async (email: string, password: string): Promise<Editor> => {
    const response = await loginEditor(email.trim().toLowerCase(), password)
    const raw = localStorage.getItem(EDITOR_AUTH_KEY)
    const existing = raw ? JSON.parse(raw) : {}
    localStorage.setItem(EDITOR_AUTH_KEY, JSON.stringify({ ...existing, editor: response.editor, session: { ...existing.session, accessToken: response.accessToken } }))
    setEditor(response.editor)
    setSession({ accessToken: response.accessToken })
    return response.editor
  }

  const logout = () => {
    localStorage.removeItem(EDITOR_AUTH_KEY)
    setEditor(null)
    setSession(null)
  }

  return (
    <EditorAuthContext.Provider value={{ editor, session, login, logout }}>
      {children}
    </EditorAuthContext.Provider>
  )
}

export const useEditorAuth = () => {
  const ctx = useContext(EditorAuthContext)
  if (!ctx) throw new Error('useEditorAuth must be used within EditorAuthProvider')
  return ctx
}
