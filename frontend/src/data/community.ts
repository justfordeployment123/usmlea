// ─── Community (global chat) data layer ───────────────────────────────────────

export type CommunityMode = 'open' | 'readonly'  // open = everyone posts, readonly = admin only

export interface CommunityMessage {
  id: string
  authorId: string
  authorName: string
  authorRole: 'student' | 'admin'
  text: string
  createdAt: string  // ISO
}

export interface CommunitySettings {
  mode: CommunityMode
}

const KEYS = {
  messages: 'nextgen.community.messages',
  settings: 'nextgen.community.settings',
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getCommunitySettings(): CommunitySettings {
  const raw = localStorage.getItem(KEYS.settings)
  if (raw) return JSON.parse(raw) as CommunitySettings
  const defaults: CommunitySettings = { mode: 'open' }
  localStorage.setItem(KEYS.settings, JSON.stringify(defaults))
  return defaults
}

export function saveCommunitySettings(settings: CommunitySettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings))
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function seedMessages(): CommunityMessage[] {
  return [
    {
      id: 'cm-1',
      authorId: 'admin',
      authorName: 'NextGen Admin',
      authorRole: 'admin',
      text: 'Welcome to the NextGen USMLE community! 🎉 Use this space to ask questions, share tips, and support each other.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: 'cm-2',
      authorId: 'student-mock-001',
      authorName: 'Alice Johnson',
      authorRole: 'student',
      text: 'Hey everyone! Just started my Step 1 prep. Any tips on Pathology resources?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'cm-3',
      authorId: 'student-mock-002',
      authorName: 'Bob Smith',
      authorRole: 'student',
      text: 'Pathoma + UWorld is the classic combo. Make sure you do questions in timed mode after you feel comfortable with the material.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
  ]
}

export function getMessages(): CommunityMessage[] {
  const raw = localStorage.getItem(KEYS.messages)
  if (raw) return JSON.parse(raw) as CommunityMessage[]
  const seeded = seedMessages()
  localStorage.setItem(KEYS.messages, JSON.stringify(seeded))
  return seeded
}

export function postMessage(msg: Omit<CommunityMessage, 'id' | 'createdAt'>): CommunityMessage {
  const messages = getMessages()
  const newMsg: CommunityMessage = {
    ...msg,
    id: `cm-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(KEYS.messages, JSON.stringify([...messages, newMsg]))
  return newMsg
}

export function deleteMessage(id: string): void {
  const messages = getMessages().filter(m => m.id !== id)
  localStorage.setItem(KEYS.messages, JSON.stringify(messages))
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
