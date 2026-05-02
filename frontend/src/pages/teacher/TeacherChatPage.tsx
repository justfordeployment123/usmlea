import { useState, useEffect, useRef } from 'react'
import { Send, Shield, MessageSquare } from 'lucide-react'
import { getGroupChatMessages, sendGroupChatMessage, getTeacherClasses } from '../../services/lmsApi'
import { useTeacherAuth } from '../../context/TeacherAuthContext'
import { supabase } from '../../lib/supabase'
import type { ChatMessage, ClassWithProduct } from '../../types/lms'
import '../../styles/chat.css'
import '../../styles/teacher.css'

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export default function TeacherChatPage() {
  const { teacher } = useTeacherAuth()

  const [classes, setClasses] = useState<ClassWithProduct[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!teacher) return
    getTeacherClasses(teacher.id).then(cls => {
      setClasses(cls)
      if (cls.length > 0) setSelectedClassId(cls[0].id)
    })
  }, [teacher])

  useEffect(() => {
    if (!selectedClassId) return
    setMessages([])
    getGroupChatMessages(selectedClassId).then(setMessages)

    const channel = supabase
      .channel(`chat:${selectedClassId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lms_chat_messages',
        filter: `class_id=eq.${selectedClassId}`,
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
  }, [selectedClassId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim() || !selectedClassId || !teacher?.id) return
    setSending(true)
    const msg = await sendGroupChatMessage(selectedClassId, teacher.id, teacher.name ?? 'Teacher', 'teacher', text.trim())
    setMessages(prev => [...prev, msg])
    setText('')
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const selectedClass = classes.find(c => c.id === selectedClassId)

  return (
    <div className="teacher-page">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>Student Chat</h1>
        <p style={{ fontSize: '0.83rem', color: '#6B7280', margin: '3px 0 0' }}>Group chat per class — all enrolled students</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: classes.length > 1 ? '220px 1fr' : '1fr', gap: 0, background: '#fff', border: '1px solid #E0E7FF', borderRadius: 14, overflow: 'hidden', height: 'calc(100vh - 200px)' }}>

        {/* Class sidebar — only shown when teacher has multiple classes */}
        {classes.length > 1 && (
          <div style={{ borderRight: '1px solid #EEF2FF', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #EEF2FF', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Your Classes
            </div>
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                style={{
                  padding: '12px 16px', border: 'none', borderBottom: '1px solid #F9FAFB',
                  background: selectedClassId === cls.id ? '#EEF2FF' : '#fff',
                  borderLeft: selectedClassId === cls.id ? '3px solid #4F46E5' : '3px solid transparent',
                  textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E1B4B' }}>{cls.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MessageSquare size={10} /> Group chat
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Chat area */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEF2FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E1B4B' }}>
                {selectedClass?.name ?? 'Select a class'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 1 }}>All enrolled students</div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, color: '#92400e' }}>
              <Shield size={11} /> Monitored by admin
            </div>
          </div>

          <div className="chat-privacy-bar">
            This is a group chat — all enrolled students can see your messages. Admin monitors all conversations.
          </div>

          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1 }}>
            {!selectedClassId ? (
              <div className="chat-empty"><p>Select a class to view its chat.</p></div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <MessageSquare size={32} style={{ opacity: 0.25 }} />
                <p>No messages yet — say hello to your students!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === teacher?.id
                const isTeacherMsg = msg.senderRole === 'teacher'
                const showDate = idx === 0 || !isSameDay(messages[idx - 1].sentAt, msg.sentAt)
                const showName = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId)

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div style={{ textAlign: 'center', margin: '0.75rem 0', fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>
                        {formatDate(msg.sentAt)}
                      </div>
                    )}
                    <div className={`chat-message ${isMe ? 'chat-message--right' : 'chat-message--left'}`}>
                      {!isMe && (
                        <div className={`chat-message__avatar ${isTeacherMsg ? 'chat-message__avatar--teacher' : 'chat-message__avatar--student'}`}>
                          {msg.senderName[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="chat-message__body">
                        {showName && !isMe && (
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isTeacherMsg ? '#4F46E5' : '#374151', marginBottom: 2 }}>
                            {msg.senderName}{isTeacherMsg ? ' (Teacher)' : ''}
                          </div>
                        )}
                        <div className="chat-message__bubble">{msg.text}</div>
                        <div className="chat-message__meta">{formatTime(msg.sentAt)}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {selectedClassId && (
            <div className="chat-input-bar">
              <textarea
                className="chat-input-bar__textarea"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message the class… (Enter to send, Shift+Enter for newline)"
                rows={1}
              />
              <button className="chat-input-bar__send" onClick={handleSend} disabled={!text.trim() || sending}>
                <Send size={15} /> Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
