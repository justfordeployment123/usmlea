import { useState, useEffect, useRef } from 'react'
import { Shield, Trash2, Users, Eye, MessageSquare } from 'lucide-react'
import { getAllClassesWithProducts, getGroupChatMessages, deleteChatMessage } from '../../services/lmsApi'
import type { ClassWithProduct, ChatMessage } from '../../types/lms'
import '../../styles/chat.css'

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export default function AdminChatSupervisionPage() {
  const [classes, setClasses] = useState<ClassWithProduct[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAllClassesWithProducts().then(cls => {
      setClasses(cls)
      if (cls[0]) setSelectedClassId(cls[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedClassId) return
    getGroupChatMessages(selectedClassId, 'admin').then(setMessages)
  }, [selectedClassId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDelete(messageId: string) {
    await deleteChatMessage(messageId)
    setMessages(prev => prev.filter(m => m.id !== messageId))
    showToast('Message deleted')
  }

  const selectedClass = classes.find(c => c.id === selectedClassId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid #E0E7FF', borderRadius: 14, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>Chat Supervision</h1>
          <p style={{ fontSize: '0.83rem', color: '#6B7280', margin: '3px 0 0' }}>Monitor group chats per class. Select a class from the left panel.</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, color: '#3730A3' }}>
          <Shield size={12} /> Admin Supervision
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="chat-panel">

        {/* Left sidebar — class list */}
        <div className="chat-sidebar">
          <div className="chat-sidebar__header">Classes</div>
          <div className="chat-sidebar__list">
            {classes.length === 0 && (
              <div style={{ padding: '16px 14px', fontSize: '0.8rem', color: '#9CA3AF' }}>No classes found.</div>
            )}
            {classes.map(cls => {
              const isActive = cls.id === selectedClassId
              return (
                <div
                  key={cls.id}
                  className={`chat-sidebar__item ${isActive ? 'chat-sidebar__item--active' : ''}`}
                  onClick={() => setSelectedClassId(cls.id)}
                >
                  <div className="chat-sidebar__name">{cls.name}</div>
                  <div className="chat-sidebar__preview">{cls.productName}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right — chat thread */}
        <div className="chat-main">
          {!selectedClass ? (
            <div className="chat-empty" style={{ flex: 1 }}>
              <MessageSquare size={32} style={{ opacity: 0.25 }} />
              <p>Select a class to view its group chat</p>
            </div>
          ) : (
            <>
              <div className="chat-main__header">
                <div>
                  <div className="chat-main__name">{selectedClass.name} — Group Chat</div>
                  <div className="chat-main__class" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={11} /> All students and teacher · {selectedClass.productName}
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, color: '#dc2626' }}>
                  <Eye size={11} /> Admin View
                </div>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <Users size={28} style={{ opacity: 0.2 }} />
                    <p>No messages in this group chat yet.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isTeacher = msg.senderRole === 'teacher'
                    const showDate = idx === 0 || !isSameDay(messages[idx - 1].sentAt, msg.sentAt)
                    const showName = idx === 0 || messages[idx - 1].senderId !== msg.senderId

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div style={{ textAlign: 'center', margin: '0.75rem 0', fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>
                            {formatDate(msg.sentAt)}
                          </div>
                        )}
                        <div className="chat-message chat-message--left" style={{ alignItems: 'flex-start' }}>
                          <div className={`chat-message__avatar ${isTeacher ? 'chat-message__avatar--teacher' : 'chat-message__avatar--student'}`}>
                            {msg.senderName[0]?.toUpperCase()}
                          </div>
                          <div className="chat-message__body" style={{ flex: 1 }}>
                            {showName && (
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isTeacher ? '#4F46E5' : '#374151', marginBottom: 2 }}>
                                {isTeacher ? `${msg.senderName} (Teacher)` : msg.senderName}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className="chat-message__bubble">{msg.text}</div>
                              <button
                                onClick={() => handleDelete(msg.id)}
                                title="Delete message"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 2, flexShrink: 0, lineHeight: 1, transition: 'color 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div className="chat-message__meta">{formatTime(msg.sentAt)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

            </>
          )}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1E1B4B', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: '0.87rem', fontWeight: 600, zIndex: 2000 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
