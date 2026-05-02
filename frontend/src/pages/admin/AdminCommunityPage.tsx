import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, Users, Lock } from 'lucide-react'
import {
  adminCommunityGetMessages,
  adminCommunityGetSettings,
  adminPostCommunityMessage,
  adminDeleteCommunityMessage,
  adminUpdateCommunityMode,
  type CommunityMessage,
  type CommunityMode,
} from '../../services/lmsApi'
import { supabase } from '../../lib/supabase'
import './AdminCommunity.css'

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

export default function AdminCommunityPage() {
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [mode, setMode] = useState<CommunityMode>('open')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  function showToast(msg: string, type: 'error' | 'success' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    // Bug fix #4: use admin-specific GET functions so admin token is always used
    Promise.all([adminCommunityGetMessages(), adminCommunityGetSettings()]).then(([msgs, m]) => {
      setMessages(msgs)
      setMode(m)
    })

    const channel = supabase
      .channel('community-admin')
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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Bug fix #2: revert mode optimistic update on failure
  async function handleModeChange(newMode: CommunityMode) {
    const prev = mode
    setMode(newMode)
    try {
      await adminUpdateCommunityMode(newMode)
    } catch {
      setMode(prev)
      showToast('Failed to update posting mode.', 'error')
    }
  }

  // Bug fix #3: show error on post failure
  async function handleSend() {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const msg = await adminPostCommunityMessage(text.trim())
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      setText('')
    } catch {
      showToast('Failed to post message.', 'error')
    } finally {
      setSending(false)
    }
  }

  // Bug fix #3: restore message on delete failure
  async function handleDelete(msg: CommunityMessage) {
    setMessages(prev => prev.filter(m => m.id !== msg.id))
    try {
      await adminDeleteCommunityMessage(msg.id)
    } catch {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      })
      showToast('Failed to delete message.', 'error')
    }
  }

  return (
    <div className="adm-community">
      <div className="adm-community__header">
        <div>
          <h1 className="adm-community__title">Community</h1>
          <p className="adm-community__subtitle">
            {messages.length} message{messages.length !== 1 ? 's' : ''} · Moderated by you
          </p>
        </div>

        <div className="adm-community__mode-wrap">
          <span className="adm-community__mode-label">Posting mode</span>
          <div className="adm-community__mode-toggle">
            <button
              type="button"
              className={`adm-community__mode-btn ${mode === 'open' ? 'adm-community__mode-btn--active' : ''}`}
              onClick={() => handleModeChange('open')}
            >
              <Users size={14} />
              Everyone can post
            </button>
            <button
              type="button"
              className={`adm-community__mode-btn ${mode === 'readonly' ? 'adm-community__mode-btn--active adm-community__mode-btn--readonly' : ''}`}
              onClick={() => handleModeChange('readonly')}
            >
              <Lock size={14} />
              Admin only
            </button>
          </div>
        </div>
      </div>

      <div className="adm-community__feed">
        {messages.map(msg => {
          const isAdmin = msg.authorRole === 'admin'
          return (
            <div key={msg.id} className="adm-community__msg">
              <div className={`adm-community__avatar ${isAdmin ? 'adm-community__avatar--admin' : ''}`}>
                {getInitials(msg.authorName)}
              </div>
              <div className="adm-community__msg-body">
                <div className="adm-community__msg-meta">
                  <span className="adm-community__msg-name">
                    {msg.authorName}
                    {isAdmin && <span className="adm-community__admin-tag">Admin</span>}
                  </span>
                  <span className="adm-community__msg-time">{formatMessageTime(msg.createdAt)}</span>
                  <button
                    type="button"
                    className="adm-community__delete"
                    onClick={() => handleDelete(msg)}
                    title="Delete message"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="adm-community__msg-text">{msg.text}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="adm-community__composer">
        <input
          className="adm-community__input"
          placeholder="Post as admin..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          maxLength={1000}
          disabled={sending}
        />
        <button
          type="button"
          className="adm-community__send"
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          <Send size={16} />
        </button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          padding: '10px 18px', borderRadius: 10, fontSize: '0.87rem', fontWeight: 600,
          background: toast.type === 'error' ? '#fee2e2' : '#1E1B4B',
          color: toast.type === 'error' ? '#dc2626' : '#fff',
          border: toast.type === 'error' ? '1px solid #fecaca' : 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
