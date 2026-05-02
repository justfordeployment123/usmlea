import { useState, useEffect } from 'react'
import { UserCog, UserPlus, Trash2, X, CheckCircle2 } from 'lucide-react'
import { adminGetEditors, adminCreateEditor, adminDeleteEditor } from '../../services/lmsApi'
import type { Editor } from '../../types/lms'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminEditorsPage() {
  const [editors, setEditors] = useState<Editor[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    adminGetEditors().then(e => {
      setEditors(e)
      setLoading(false)
    })
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function openModal() {
    setName(''); setEmail(''); setPassword('')
    setFormError(''); setCreated(null)
    setShowModal(true)
  }

  async function handleCreate() {
    if (!name.trim()) { setFormError('Name is required.'); return }
    if (!email.trim()) { setFormError('Email is required.'); return }
    if (password.length < 6) { setFormError('Password must be at least 6 characters.'); return }
    setFormError(''); setSubmitting(true)
    try {
      const editor = await adminCreateEditor({ name: name.trim(), email: email.trim().toLowerCase(), password })
      setEditors(prev => [...prev, editor])
      setCreated({ name: name.trim(), email: email.trim().toLowerCase(), password })
      setName(''); setEmail(''); setPassword('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create editor.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, editorName: string) {
    if (!window.confirm(`Remove editor "${editorName}"? This will delete their account permanently.`)) return
    setDeletingId(id)
    try {
      await adminDeleteEditor(id)
      setEditors(prev => prev.filter(e => e.id !== id))
      showToast(`${editorName} removed.`)
    } catch {
      showToast('Failed to remove editor.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid #E0E7FF', borderRadius: 14, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>Editor Management</h1>
          <p style={{ fontSize: '0.83rem', color: '#6B7280', margin: '3px 0 0' }}>
            Create and manage editor accounts. Editors can upload content and supervise chats.
          </p>
        </div>
        <button
          onClick={openModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#3730A3', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer' }}
        >
          <UserPlus size={14} /> Add Editor
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <div style={{ background: '#fff', border: '1px solid #E0E7FF', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <UserCog size={18} color="#4F46E5" />
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>Total Editors</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E1B4B', lineHeight: 1.2 }}>{editors.length}</div>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 2 }}>active accounts</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E0E7FF', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserCog size={15} color="#4F46E5" />
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1E1B4B' }}>All Editors</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9CA3AF' }}>{editors.length} account{editors.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: '0.87rem' }}>Loading…</div>
        ) : editors.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <UserCog size={36} color="#D1D5DB" style={{ marginBottom: 10 }} />
            <p style={{ color: '#6B7280', fontWeight: 600, margin: '0 0 4px' }}>No editors yet</p>
            <p style={{ color: '#9CA3AF', fontSize: '0.82rem', margin: 0 }}>Click "Add Editor" to create the first one.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Name', 'Email', 'Created', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editors.map((ed, idx) => (
                  <tr key={ed.id} style={{ borderBottom: idx < editors.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1E1B4B' }}>{ed.name}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{ed.email}</td>
                    <td style={{ padding: '12px 16px', color: '#6B7280' }}>{formatDate(ed.createdAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleDelete(ed.id, ed.name)}
                        disabled={deletingId === ed.id}
                        title="Remove editor"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, color: '#DC2626', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                        {deletingId === ed.id ? 'Removing…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Editor Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>Add Editor Account</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {created ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <CheckCircle2 size={26} color="#16A34A" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E1B4B' }}>Editor Created!</div>
                  <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: 4 }}>Share these credentials securely.</div>
                </div>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', fontSize: '0.85rem', lineHeight: 1.9 }}>
                  <div><strong>Name:</strong> {created.name}</div>
                  <div><strong>Email:</strong> {created.email}</div>
                  <div><strong>Password:</strong> <code style={{ background: '#EEF2FF', padding: '1px 6px', borderRadius: 4, color: '#4F46E5' }}>{created.password}</code></div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button onClick={() => { setCreated(null) }} style={{ flex: 1, padding: '9px 0', background: '#EEF2FF', border: 'none', borderRadius: 8, color: '#4F46E5', fontWeight: 600, fontSize: '0.87rem', cursor: 'pointer' }}>
                    Add Another
                  </button>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '9px 0', background: '#1E1B4B', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: '0.87rem', cursor: 'pointer' }}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {['Name', 'Email'].map((label, i) => {
                  const val = i === 0 ? name : email
                  const set = i === 0 ? setName : setEmail
                  return (
                    <div key={label}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
                      <input
                        type={i === 1 ? 'email' : 'text'}
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder={i === 0 ? 'Full name' : 'editor@example.com'}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #E0E7FF', borderRadius: 8, fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  )
                })}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Password</label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E0E7FF', borderRadius: 8, fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {formError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: '#DC2626' }}>
                    {formError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '9px 0', background: '#F3F4F6', border: 'none', borderRadius: 8, color: '#374151', fontWeight: 600, fontSize: '0.87rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleCreate} disabled={submitting} style={{ flex: 1, padding: '9px 0', background: submitting ? '#C7D2FE' : '#3730A3', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: '0.87rem', cursor: 'pointer' }}>
                    {submitting ? 'Creating…' : 'Create Editor'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1E1B4B', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: '0.87rem', fontWeight: 600, zIndex: 2000 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
