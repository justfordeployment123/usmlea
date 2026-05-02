import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, ChevronLeft, Users } from 'lucide-react'
import { getGroupChatMessages, sendGroupChatMessage, getClassById } from '../../services/lmsApi'
import { useStudentAuth } from '../../context/StudentAuthContext'
import { supabase } from '../../lib/supabase'
import type { ChatMessage, LmsClass } from '../../types/lms'
import '../../styles/chat.css'

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d: string) {
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export default function StudentChatPage() {
  const { classId } = useParams<{ classId: string }>()
  const { user } = useStudentAuth()

  const [cls, setCls] = useState<LmsClass | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!classId) return
    Promise.all([
      getClassById(classId),
      getGroupChatMessages(classId, 'student'),
    ]).then(([clsData, msgs]) => {
      setCls(clsData)
      setMessages(msgs)
    })

    const channel = supabase
      .channel(`chat:${classId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lms_chat_messages',
        filter: `class_id=eq.${classId}`,
      }, payload => {
        const row = payload.new as Record<string, unknown>
        const msg: ChatMessage = {
          id: row.id as string,
          classId: row.class_id as string,
          senderId: row.sender_id as string,
          senderName: row.sender_name as string,
          senderRole: row.sender_role as 'teacher' | 'student',
          text: row.text as string,
          sentAt: row.sent_at as string,
        }
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [classId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim() || !classId || !user?.id) return
    setSending(true)
    const msg = await sendGroupChatMessage(classId, user.id, user.name ?? 'Student', 'student', text.trim())
    setMessages(prev => [...prev, msg])
    setText('')
    setSending(false)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', background: '#F8F9FC' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E0E7FF', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <Link
          to={`/student/classes/${classId}/session`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #E0E7FF', color: '#6B7280', textDecoration: 'none', flexShrink: 0 }}
        >
          <ChevronLeft size={16} />
        </Link>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #3730A3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Users size={16} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E1B4B' }}>
            {cls?.name ?? 'Class'} — Group Chat
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 1 }}>
            All students and teacher
          </div>
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '3px 8px' }}>
          Supervised
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
        {messages.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="#C7D2FE" />
            </div>
            <p style={{ margin: 0, fontWeight: 600, color: '#6B7280', fontSize: '0.9rem' }}>No messages yet</p>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>Start the class discussion!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === user?.id
              const isTeacher = msg.senderRole === 'teacher'
              const showDate = idx === 0 || !isSameDay(messages[idx - 1].sentAt, msg.sentAt)
              const prevMsg = messages[idx - 1]
              const showAvatar = !isMe && (idx === 0 || prevMsg.senderId !== msg.senderId || showDate)
              const showName = !isMe && showAvatar
              const isLastInGroup = isMe
                ? (idx === messages.length - 1 || messages[idx + 1].senderId !== msg.senderId)
                : false

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' }}>
                      <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatDate(msg.sentAt)}
                      </span>
                      <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                    marginBottom: isLastInGroup ? 6 : 2,
                    marginLeft: isMe ? 'auto' : undefined,
                    marginRight: isMe ? undefined : 'auto',
                    maxWidth: '75%',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}>
                    {/* Avatar — only for others, only at bottom of a group */}
                    {!isMe && (
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: isTeacher ? '#1E1B4B' : '#4F46E5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: '#fff',
                        visibility: showAvatar ? 'visible' : 'hidden',
                        alignSelf: 'flex-end',
                      }}>
                        {msg.senderName[0]?.toUpperCase()}
                      </div>
                    )}

                    <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', gap: 1, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {showName && (
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isTeacher ? '#4F46E5' : '#374151', marginBottom: 3, paddingLeft: 4 }}>
                          {isTeacher ? `${msg.senderName} · Teacher` : msg.senderName}
                        </div>
                      )}
                      <div style={{
                        padding: '9px 14px',
                        borderRadius: isMe
                          ? '18px 18px 4px 18px'
                          : '18px 18px 18px 4px',
                        background: isMe ? '#4F46E5' : '#fff',
                        color: isMe ? '#fff' : '#1E1B4B',
                        fontSize: '0.87rem',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        boxShadow: isMe ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                        border: isMe ? 'none' : '1px solid #E9ECF2',
                      }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: '0.67rem', color: '#9CA3AF', paddingInline: 4, marginTop: 2 }}>
                        {formatTime(msg.sentAt)}
                      </div>
                    </div>

                    {/* Spacer for "me" side so avatar area is reserved */}
                    {isMe && <div style={{ width: 30, flexShrink: 0 }} />}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ background: '#fff', borderTop: '1px solid #E0E7FF', padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message the group…"
          rows={1}
          style={{
            flex: 1, padding: '10px 14px', border: '1px solid #E0E7FF', borderRadius: 12,
            fontSize: '0.87rem', fontFamily: 'inherit', resize: 'none',
            minHeight: 42, maxHeight: 120, lineHeight: 1.5, color: '#1E1B4B',
            background: '#F8F9FC', outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = '#4F46E5')}
          onBlur={e => (e.target.style.borderColor = '#E0E7FF')}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: text.trim() && !sending ? '#4F46E5' : '#E0E7FF',
            color: text.trim() && !sending ? '#fff' : '#9CA3AF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
