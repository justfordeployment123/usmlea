import { useEffect, useMemo, useState } from 'react'
import { Search, Settings2, AlertTriangle, Trash2 } from 'lucide-react'
import { adminGetStudents, adminRemoveEnrollment, adminUpdateEnrollment } from '../../services/lmsApi'
import '../../styles/admin-student-ops.css'

interface StudentEnrollment { classId: string; className: string; enrolledAt: string; demoExpiresAt: string | null }
interface StudentSummary { id: string; name: string; email: string; phone: string; registeredAt: string; enrollments: StudentEnrollment[] }

type LmsStatus = 'full' | 'demo_active' | 'demo_expired' | 'none'
type ManageAction = 'extend' | 'full_access' | 'revoke'

function getLmsStatus(enrollments: StudentEnrollment[]): LmsStatus {
  if (enrollments.length === 0) return 'none'
  const now = new Date()
  if (enrollments.some(e => e.demoExpiresAt === null)) return 'full'
  if (enrollments.some(e => e.demoExpiresAt !== null && new Date(e.demoExpiresAt) > now)) return 'demo_active'
  return 'demo_expired'
}

function getClassStatus(e: StudentEnrollment): 'full' | 'demo_active' | 'demo_expired' {
  if (e.demoExpiresAt === null) return 'full'
  return new Date(e.demoExpiresAt) > new Date() ? 'demo_active' : 'demo_expired'
}

const STATUS_BADGE: Record<LmsStatus, { label: string; bg: string; color: string; border: string }> = {
  full:         { label: 'Full Access', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  demo_active:  { label: 'Demo Active', bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  demo_expired: { label: 'Demo Expired', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  none:         { label: 'Not Enrolled', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [toast, setToast] = useState<string | null>(null)

  // Per-class manage modal
  const [manageModal, setManageModal] = useState<{ studentId: string; studentName: string; classId: string; className: string; currentStatus: 'demo_active' | 'demo_expired' } | null>(null)
  const [manageAction, setManageAction] = useState<ManageAction>('extend')
  const [manageExtendDays, setManageExtendDays] = useState(7)
  const [manageSubmitting, setManageSubmitting] = useState(false)

  // Per-class remove modal
  const [removeModal, setRemoveModal] = useState<{ studentId: string; studentName: string; classId: string; className: string } | null>(null)
  const [removeConfirmed, setRemoveConfirmed] = useState(false)
  const [removeSubmitting, setRemoveSubmitting] = useState(false)

  useEffect(() => {
    adminGetStudents().then(studs => {
      setStudents(studs as StudentSummary[])
      if ((studs as StudentSummary[])[0]) setSelectedId((studs as StudentSummary[])[0].id)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return students
    return students.filter(s =>
      s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    )
  }, [students, searchTerm])

  const activeId = filtered.some(s => s.id === selectedId) ? selectedId : (filtered[0]?.id ?? '')
  const selected = students.find(s => s.id === activeId) ?? null

  const kpis = useMemo(() => ({
    total: students.length,
    full: students.filter(s => getLmsStatus(s.enrollments) === 'full').length,
    demoActive: students.filter(s => getLmsStatus(s.enrollments) === 'demo_active').length,
    notEnrolled: students.filter(s => getLmsStatus(s.enrollments) === 'none').length,
  }), [students])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleManageSubmit() {
    if (!manageModal) return
    setManageSubmitting(true)
    const action: Parameters<typeof adminUpdateEnrollment>[2] =
      manageAction === 'extend'     ? { type: 'extend', days: manageExtendDays }
      : manageAction === 'full_access' ? { type: 'full_access' }
      : { type: 'revoke' }
    await adminUpdateEnrollment(manageModal.classId, manageModal.studentId, action)
    const updated = await adminGetStudents()
    setStudents(updated as StudentSummary[])
    setManageSubmitting(false)
    setManageModal(null)
    showToast('Enrollment updated ✓')
  }

  async function handleRemoveEnrollment() {
    if (!removeModal || !removeConfirmed) return
    setRemoveSubmitting(true)
    await adminRemoveEnrollment(removeModal.classId, removeModal.studentId)
    const updated = await adminGetStudents()
    setStudents(updated as StudentSummary[])
    setRemoveSubmitting(false)
    setRemoveModal(null)
    setRemoveConfirmed(false)
    showToast('Student removed from class ✓')
  }

  if (loading) {
    return (
      <div className="admin-students-page">
        <header className="admin-students-header"><h1>Student Insights</h1></header>
        <div style={{ padding: 32, color: '#6B7280', fontSize: '0.9rem' }}>Loading students…</div>
      </div>
    )
  }

  return (
    <div className="admin-students-page">
      <header className="admin-students-header">
        <h1>Student Insights</h1>
        <p>All registered students and their LMS access status.</p>
      </header>

      <section className="admin-students-kpis">
        <article className="admin-students-kpi"><h4>Total Students</h4><p>{kpis.total}</p></article>
        <article className="admin-students-kpi"><h4>Full Access</h4><p>{kpis.full}</p></article>
        <article className="admin-students-kpi"><h4>Demo Active</h4><p>{kpis.demoActive}</p></article>
        <article className="admin-students-kpi"><h4>Not Enrolled</h4><p>{kpis.notEnrolled}</p></article>
      </section>

      <section className="admin-students-filters card">
        <label className="admin-students-input">
          <Search size={16} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or email" />
        </label>
      </section>

      <section className="admin-students-grid">
        <article className="card admin-students-table-card">
          <h3>Student Directory</h3>
          <p>{filtered.length} students</p>
          <div className="admin-students-table-wrap">
            <table className="admin-students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Registered</th>
                  <th>LMS Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(student => {
                  const status = getLmsStatus(student.enrollments)
                  const badge = STATUS_BADGE[status]
                  return (
                    <tr key={student.id} className={student.id === activeId ? 'selected' : ''} onClick={() => setSelectedId(student.id)}>
                      <td>
                        <strong>{student.name || '—'}</strong>
                        <span>{student.email}</span>
                      </td>
                      <td>{new Date(student.registeredAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      </td>
                      <td />
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="admin-students-empty">No students match your search.</div>}
          </div>
        </article>

        <article className="card admin-students-detail-card">
          {selected ? (
            (() => {
              const status = getLmsStatus(selected.enrollments)
              const badge = STATUS_BADGE[status]
              return (
                <>
                  <header className="admin-students-detail-header">
                    <div>
                      <h3>{selected.name || '—'}</h3>
                      <p>{selected.email}</p>
                    </div>
                    <span style={{ padding: '5px 10px', background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, color: badge.color, whiteSpace: 'nowrap' }}>
                      {badge.label}
                    </span>
                  </header>

                  <div className="admin-students-meta">
                    <span>Phone: {selected.phone || '—'}</span>
                    <span>Registered: {new Date(selected.registeredAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  {selected.enrollments.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Enrolled Classes</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selected.enrollments.map(e => {
                          const classStatus = getClassStatus(e)
                          const isDemo = classStatus === 'demo_active' || classStatus === 'demo_expired'
                          const daysLeft = e.demoExpiresAt
                            ? Math.max(0, Math.ceil((new Date(e.demoExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                            : 0

                          const classBadge =
                            classStatus === 'full'
                              ? { label: 'Full Access', bg: '#dcfce7', color: '#15803d' }
                              : classStatus === 'demo_active'
                              ? { label: `Demo · ${daysLeft}d left`, bg: '#fef9c3', color: '#a16207' }
                              : { label: 'Demo Expired', bg: '#fee2e2', color: '#dc2626' }

                          return (
                            <div key={e.classId} style={{ background: '#F9FAFB', border: '1px solid #E0E7FF', borderRadius: 8, padding: '10px 12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.className || '—'}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 2 }}>
                                    Enrolled {new Date(e.enrolledAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                  <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: 99, background: classBadge.bg, color: classBadge.color, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    {classBadge.label}
                                  </span>
                                  {isDemo && (
                                    <button
                                      onClick={() => {
                                        setManageAction('extend')
                                        setManageExtendDays(7)
                                        setManageModal({ studentId: selected.id, studentName: selected.name, classId: e.classId, className: e.className, currentStatus: classStatus })
                                      }}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600, background: '#EEF2FF', color: '#3730A3', border: '1px solid #C7D2FE', borderRadius: 6, cursor: 'pointer' }}
                                    >
                                      <Settings2 size={11} /> Manage
                                    </button>
                                  )}
                                  {classStatus === 'full' && (
                                    <button
                                      onClick={() => {
                                        setRemoveConfirmed(false)
                                        setRemoveModal({ studentId: selected.id, studentName: selected.name, classId: e.classId, className: e.className })
                                      }}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600, background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer' }}
                                    >
                                      <Trash2 size={11} /> Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )
            })()
          ) : (
            <p className="admin-students-empty-inline">Select a student to view details.</p>
          )}
        </article>
      </section>

      {/* Per-class Manage Modal */}
      {manageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px 24px', width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Settings2 size={18} style={{ color: '#3730A3' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1E1B4B' }}>Manage Class Enrollment</h3>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '0.83rem', color: '#374151', fontWeight: 600 }}>{manageModal.studentName}</p>
            <p style={{ margin: '0 0 18px', fontSize: '0.8rem', color: '#6B7280' }}>{manageModal.className}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {(['extend', 'full_access', 'revoke'] as const).map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1px solid ${manageAction === opt ? '#3730A3' : '#E0E7FF'}`, borderRadius: 8, cursor: 'pointer', background: manageAction === opt ? '#EEF2FF' : '#fff' }}>
                  <input type="radio" name="manageAction" checked={manageAction === opt} onChange={() => setManageAction(opt)} style={{ accentColor: '#3730A3' }} />
                  <div>
                    <div style={{ fontSize: '0.87rem', fontWeight: 600, color: '#1E1B4B' }}>
                      {opt === 'extend' ? 'Extend demo' : opt === 'full_access' ? 'Grant Full Access' : 'Revoke demo access'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: 1 }}>
                      {opt === 'extend' ? 'Add more days to demo for this class only'
                        : opt === 'full_access' ? 'Convert to paid access for this class — no payment needed'
                        : 'Expire demo immediately for this class'}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {manageAction === 'extend' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Days to add (1–365)</label>
                <input
                  type="number" min={1} max={365} value={manageExtendDays}
                  onChange={e => setManageExtendDays(Math.min(365, Math.max(1, Number(e.target.value))))}
                  style={{ padding: '8px 12px', border: '1px solid #C7D2FE', borderRadius: 8, fontSize: '0.9rem', width: 100 }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setManageModal(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E0E7FF', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleManageSubmit} disabled={manageSubmitting} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3730A3', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', opacity: manageSubmitting ? 0.6 : 1 }}>
                {manageSubmitting ? 'Saving…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Enrollment Modal */}
      {removeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px 24px', width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>

            {/* Step 1 — Warning header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18, padding: '14px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10 }}>
              <AlertTriangle size={20} style={{ color: '#ea580c', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#9a3412', marginBottom: 4 }}>This action is not reversible from here</div>
                <div style={{ fontSize: '0.82rem', color: '#c2410c', lineHeight: 1.5 }}>
                  Removing this student will immediately revoke their class access.
                  <strong> No automatic refund will be issued.</strong> If the student is owed a refund,
                  you must process it manually through your Stripe dashboard.
                </div>
              </div>
            </div>

            {/* Step 2 — What will be removed */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>You are removing:</div>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E1B4B' }}>{removeModal.studentName}</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 2 }}>from <strong style={{ color: '#374151' }}>{removeModal.className}</strong></div>
              </div>
            </div>

            {/* Step 3 — Checkbox confirmation */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', border: `1.5px solid ${removeConfirmed ? '#dc2626' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: removeConfirmed ? '#fff5f5' : '#fff', marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={removeConfirmed}
                onChange={e => setRemoveConfirmed(e.target.checked)}
                style={{ accentColor: '#dc2626', marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#374151', lineHeight: 1.5 }}>
                I understand this student paid for access and I will handle any applicable refund manually in Stripe.
              </span>
            </label>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setRemoveModal(null); setRemoveConfirmed(false) }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E0E7FF', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveEnrollment}
                disabled={!removeConfirmed || removeSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: removeConfirmed ? '#dc2626' : '#E5E7EB', color: removeConfirmed ? '#fff' : '#9CA3AF', fontWeight: 700, fontSize: '0.85rem', cursor: removeConfirmed ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
              >
                <Trash2 size={14} />
                {removeSubmitting ? 'Removing…' : 'Remove from Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1E1B4B', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: '0.87rem', fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
