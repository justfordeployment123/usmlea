import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Users, Video, ArrowRight, CheckCircle2, GraduationCap, Clock, Lock } from 'lucide-react'
import { useStudentAuth } from '../../context/StudentAuthContext'
import { getAvailablePrograms, studentGetEnrollmentOverview, startDemoEnrollment } from '../../services/lmsApi'
import type { ProgramListing, EnrollmentOverview } from '../../services/lmsApi'
import './StudentProgramsPage.css'

type ProductAccess = 'full' | 'demo_active' | 'demo_expired' | 'none'

function getDaysLeft(demoExpiresAt: string | null): number {
  if (!demoExpiresAt) return 0
  return Math.max(0, Math.ceil((new Date(demoExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

export default function StudentProgramsPage() {
  const { user } = useStudentAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<ProgramListing[]>([])
  const [overview, setOverview] = useState<EnrollmentOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [pricingMode, setPricingMode] = useState<Record<string, 'upfront' | 'installment'>>({})
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
  const [demoError, setDemoError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [progs, ov] = await Promise.all([
        getAvailablePrograms(),
        user ? studentGetEnrollmentOverview() : Promise.resolve([]),
      ])
      setPrograms(progs)
      setOverview(ov)
      const modes: Record<string, 'upfront' | 'installment'> = {}
      progs.forEach(p => { modes[p.product.id] = 'upfront' })
      setPricingMode(modes)
      setLoading(false)
    }
    load()
  }, [user])

  function getAccessForProduct(productId: string): { type: ProductAccess; demoExpiresAt: string | null } {
    const enrollment = overview.find(e => e.productId === productId)
    if (!enrollment) return { type: 'none', demoExpiresAt: null }
    return { type: enrollment.accessType, demoExpiresAt: enrollment.demoExpiresAt }
  }

  async function handleTryDemo(productId: string) {
    setDemoLoading(productId)
    setDemoError(null)
    try {
      await startDemoEnrollment(productId)
      navigate('/student/classes')
    } catch (err: any) {
      setDemoError(err?.message ?? 'Could not start demo. Please try again.')
      setDemoLoading(null)
    }
  }

  if (loading) return <div className="programs-loading">Loading programs…</div>

  if (programs.length === 0) {
    return (
      <div className="programs-empty">
        <BookOpen size={48} />
        <h2>No programs available yet</h2>
        <p>Check back soon — new courses are on the way.</p>
      </div>
    )
  }

  return (
    <div className="programs-page">
      <header className="programs-header">
        <h1>Available Programs</h1>
        <p>Enroll in a live session class with an expert teacher.</p>
      </header>

      {demoError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: '0.85rem', color: '#DC2626' }}>
          {demoError}
        </div>
      )}

      <div className="programs-grid">
        {programs.map(({ product, teacherName, sessionCount, enrolledCount }) => {
          const { type: accessType, demoExpiresAt } = getAccessForProduct(product.id)
          const mode = pricingMode[product.id] ?? 'upfront'
          const daysLeft = getDaysLeft(demoExpiresAt)

          return (
            <div key={product.id} className="program-card">
              {accessType === 'full' && (
                <div className="program-card__enrolled-badge">
                  <CheckCircle2 size={13} /> Enrolled
                </div>
              )}
              {accessType === 'demo_active' && (
                <div className="program-card__enrolled-badge" style={{ background: '#fef9c3', color: '#a16207', borderColor: '#fde68a' }}>
                  <Clock size={13} /> Demo — {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </div>
              )}
              {accessType === 'demo_expired' && (
                <div className="program-card__enrolled-badge" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
                  <Lock size={13} /> Demo Expired
                </div>
              )}

              <div className="program-card__body">
                <h2 className="program-card__name">{product.name}</h2>
                <p className="program-card__desc">{product.description}</p>

                <div className="program-card__meta">
                  <span><GraduationCap size={14} /> {teacherName}</span>
                  <span><Video size={14} /> {sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>
                  <span><Users size={14} /> {enrolledCount} enrolled</span>
                </div>
              </div>

              <div className="program-card__footer">
                {/* Pricing toggle — only for unenrolled/expired */}
                {(accessType === 'none' || accessType === 'demo_expired') && (
                  <div className="program-card__pricing">
                    <div className="program-pricing-toggle">
                      <button
                        className={`program-pricing-btn ${mode === 'upfront' ? 'program-pricing-btn--active' : ''}`}
                        onClick={() => setPricingMode(prev => ({ ...prev, [product.id]: 'upfront' }))}
                      >
                        Upfront
                      </button>
                      <button
                        className={`program-pricing-btn ${mode === 'installment' ? 'program-pricing-btn--active' : ''}`}
                        onClick={() => setPricingMode(prev => ({ ...prev, [product.id]: 'installment' }))}
                      >
                        Installments
                      </button>
                    </div>
                    <div className="program-card__price">
                      {mode === 'upfront' ? (
                        <span>${product.upfrontPrice}</span>
                      ) : (
                        <span>${product.installmentAmount}<em>/mo × {product.installmentMonths}</em></span>
                      )}
                    </div>
                  </div>
                )}

                <div className="program-card__actions">
                  <Link to={`/student/programs/${product.id}`} className="program-card__details-btn">
                    View Details
                  </Link>

                  {accessType === 'full' && (
                    <Link to="/student/classes" className="program-card__cta program-card__cta--enrolled">
                      Go to My Classes <ArrowRight size={15} />
                    </Link>
                  )}

                  {accessType === 'demo_active' && (
                    <Link to="/student/classes" className="program-card__cta" style={{ background: '#a16207', borderColor: '#a16207' }}>
                      Continue Demo <ArrowRight size={15} />
                    </Link>
                  )}

                  {accessType === 'demo_expired' && (
                    <Link
                      to={`/student/checkout/${product.id}`}
                      className="program-card__cta"
                      state={{ plan: mode }}
                    >
                      Enroll Now to Continue <ArrowRight size={15} />
                    </Link>
                  )}

                  {accessType === 'none' && (
                    <>
                      <button
                        className="program-card__demo-btn"
                        onClick={() => handleTryDemo(product.id)}
                        disabled={demoLoading === product.id}
                      >
                        {demoLoading === product.id ? 'Starting…' : 'Try Demo — 2 days free'}
                      </button>
                      <Link
                        to={`/student/checkout/${product.id}`}
                        className="program-card__cta"
                        state={{ plan: mode }}
                      >
                        Enroll Now <ArrowRight size={15} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
