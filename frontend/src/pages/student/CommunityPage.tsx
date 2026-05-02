import { useState, useEffect, useRef } from 'react'
import { Send, Shield } from 'lucide-react'
import { useStudentAuth } from '../../context/StudentAuthContext'
import {
  communityGetMessages,
  communityGetSettings,
  communityPostMessage,
  type CommunityMessage,
  type CommunityMode,
} from '../../services/lmsApi'
import { supabase } from '../../lib/supabase'
import './Community.css'

const AVATAR_PALETTE: [string, string][] = [
  ['#E0E7FF', '#4338CA'],
  ['#dcfce7', '#15803d'],
  ['#fce7f3', '#be185d'],
  ['#fef3c7', '#b45309'],
  ['#ede9fe', '#7c3aed'],
  ['#ffedd5', '#c2410c'],
  ['#cffafe', '#0e7490'],
]

// Bug fix #5: guard against empty name to prevent charCodeAt(0) → NaN crash
function getAvatarStyle(name: string): { background: string; color: string } {
  const idx = name.length > 0 ? name.charCodeAt(0) % AVATAR_PALETTE.length : 0
  const [bg, fg] = AVATAR_PALETTE[idx]!
  return { background: bg, color: fg }
}

function getInitials(name: string) {
  if (!name.trim()) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CommunityPage() {
  const { user } = useStudentAuth()
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [mode, setMode] = useState<CommunityMode>('open')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([communityGetMessages(), communityGetSettings()]).then(([msgs, m]) => {
      setMessages(msgs)
      setMode(m)
    })

    const channel = supabase
      .channel('community')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, payload => {
        const row = payload.new as Record<string, unknown>
        const msg: CommunityMessage = {
          id: row.id as string,
          authorId: row.author_id as string,
          authorName: row.author_name as string,
          authorRole: row.author_role as 'student' | 'admin',
          text: row.text as string,
          createdAt: row.created_at as string,
        }
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_messages' }, payload => {
        const row = payload.old as Record<string, unknown>
        setMessages(prev => prev.filter(m => m.id !== (row.id as string)))
      })
      // Bug fix #6: subscribe to settings changes so mode flips in real-time
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_settings' }, payload => {
        const row = payload.new as Record<string, unknown>
        const newMode = row.mode as CommunityMode
        setMode(newMode)
        if (newMode === 'readonly') {
          setError('The admin has disabled posting.')
          setTimeout(() => setError(null), 4000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Bug fix #1: show error feedback on post failure instead of silent ignore
  async function handleSend() {
    if (!text.trim() || !user || sending) return
    setSending(true)
    setError(null)
    try {
      const msg = await communityPostMessage(text.trim())
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      setText('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message.'
      if (message.toLowerCase().includes('read-only') || message.toLowerCase().includes('disabled')) {
        setMode('readonly')
        setError('Posting has been disabled by the admin.')
      } else {
        setError('Failed to send. Please try again.')
      }
    } finally {
      setSending(false)
    }
  }

  const canPost = mode === 'open'

  return (
    <div className="community-page">
      <div className="community-header">
        <div>
          <h1 className="community-title">Community</h1>
          <p className="community-subtitle">A space for all NextGen students to connect and learn together</p>
        </div>
        {mode === 'readonly' && (
          <div className="community-readonly-badge">
            <Shield size={13} />
            Read-only mode — only admins can post
          </div>
        )}
      </div>

      <div className="community-feed">
        {messages.map(msg => {
          const isOwn = msg.authorId === user?.id
          const isAdmin = msg.authorRole === 'admin'
          const avatarStyle = isAdmin
            ? { background: 'var(--color-navy)', color: '#fff' }
            : isOwn
              ? { background: '#4F46E5', color: '#fff' }
              : getAvatarStyle(msg.authorName)
          return (
            <div key={msg.id} className={`community-msg ${isOwn ? 'community-msg--own' : ''}`}>
              <div className="community-msg__avatar" style={avatarStyle}>
                {getInitials(msg.authorName)}
              </div>
              <div className="community-msg__body">
                <div className="community-msg__meta">
                  <span className="community-msg__name">
                    {msg.authorName}
                    {isAdmin && <span className="community-msg__admin-tag">Admin</span>}
                  </span>
                  <span className="community-msg__time">{formatMessageTime(msg.createdAt)}</span>
                </div>
                <p className="community-msg__text">{msg.text}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div style={{ fontSize: '0.82rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 6, flexShrink: 0 }}>
          {error}
        </div>
      )}

      <div className="community-composer">
        {canPost ? (
          <>
            <input
              className="community-composer__input"
              placeholder="Write a message..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              maxLength={1000}
              disabled={sending}
            />
            <button
              type="button"
              className="community-composer__send"
              onClick={handleSend}
              disabled={!text.trim() || sending}
            >
              <Send size={16} />
            </button>
          </>
        ) : (
          <div className="community-composer__disabled">
            <Shield size={14} />
            Posting is currently disabled by the admin
          </div>
        )}
      </div>
    </div>
  )
}
