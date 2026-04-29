import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, Users, Lock } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  getMessages, postMessage, deleteMessage,
  getCommunitySettings, saveCommunitySettings,
  formatMessageTime,
  type CommunityMessage, type CommunityMode,
} from '../../data/community'
import './AdminCommunity.css'

export default function AdminCommunityPage() {
  const { admin: user } = useAdminAuth()
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [mode, setMode] = useState<CommunityMode>('open')
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(getMessages())
    setMode(getCommunitySettings().mode)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleModeChange(newMode: CommunityMode) {
    setMode(newMode)
    saveCommunitySettings({ mode: newMode })
  }

  function handleSend() {
    if (!text.trim() || !user) return
    const msg = postMessage({
      authorId: 'admin',
      authorName: user.name || 'Admin',
      authorRole: 'admin',
      text: text.trim(),
    })
    setMessages(prev => [...prev, msg])
    setText('')
  }

  function handleDelete(id: string) {
    deleteMessage(id)
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
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

        {/* Mode toggle */}
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

      {/* Feed */}
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
                    onClick={() => handleDelete(msg.id)}
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

      {/* Composer — admin can always post */}
      <div className="adm-community__composer">
        <input
          className="adm-community__input"
          placeholder="Post as admin..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          maxLength={1000}
        />
        <button
          type="button"
          className="adm-community__send"
          onClick={handleSend}
          disabled={!text.trim()}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
