import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, Clock, Video, MessageCircle, FileText, BarChart2, Check, Tag, ArrowRight } from 'lucide-react'
import { getProgramById, validateCoupon } from '../../services/lmsApi'
import type { ProgramDetail } from '../../services/lmsApi'
import '../../styles/payment.css'

const INCLUDED = [
  { icon: Video, label: 'Live group sessions (twice weekly)' },
  { icon: FileText, label: 'Full recorded session library' },
  { icon: MessageCircle, label: 'Direct teacher chat' },
  { icon: BarChart2, label: 'Attendance tracking' },
  { icon: Users, label: 'Small group format (max 20 students)' },
]

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const [program, setProgram] = useState<ProgramDetail | null>(null)
  const [plan, setPlan] = useState<'upfront' | 'installment'>('upfront')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState<{ value: number; type: 'percentage' | 'fixed' } | null>(null)
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    if (!productId) return
    getProgramById(productId).then(p => { if (p) setProgram(p) })
  }, [productId])

  if (!program) return <div style={{ padding: '2rem 20px', color: '#6B7280' }}>Loading…</div>

  const basePrice = plan === 'upfront' ? program.upfrontPrice : program.installmentAmount
  let discount = 0
  if (couponDiscount) {
    discount = couponDiscount.type === 'percentage'
      ? Math.round(basePrice * couponDiscount.value / 100)
      : Math.min(couponDiscount.value, basePrice)
  }
  const finalPrice = basePrice - discount

  async function handleApplyCoupon() {
    setCouponError('')
    setCouponDiscount(null)
    const result = await validateCoupon(couponCode, program!.productId)
    if (result.valid) {
      setCouponDiscount({ value: result.discount, type: result.type })
    } else {
      setCouponError(result.message ?? 'Invalid coupon.')
    }
  }

  const upcomingSessions = program.sessions.filter(s => s.status === 'scheduled').slice(0, 5)

  return (
    <div className="product-detail-page">
      {/* Hero */}
      <div className="product-hero">
        <h1>{program.name}</h1>
        <p>{program.description}</p>
        {program.teacherName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {program.teacherName[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Taught by {program.teacherName}</div>
              {program.teacherBio && <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>{program.teacherBio.slice(0, 80)}…</div>}
            </div>
          </div>
        )}
        <div className="product-hero-stats">
          <div className="product-hero-stat"><Users size={14} /> {program.enrolledCount} students enrolled</div>
          <div className="product-hero-stat"><Video size={14} /> {program.sessionCount} sessions total</div>
          <div className="product-hero-stat"><Clock size={14} /> 90 min avg</div>
        </div>
      </div>

      {/* Pricing */}
      <div className="product-pricing-card">
        <h2>Pricing</h2>
        <div className="pricing-toggle">
          {(['upfront', 'installment'] as const).map(p => (
            <button key={p} className={`pricing-toggle__btn ${plan === p ? 'pricing-toggle__btn--active' : ''}`} onClick={() => { setPlan(p); setCouponDiscount(null) }}>
              {p === 'upfront' ? 'Pay Upfront' : 'Installments'}
            </button>
          ))}
        </div>
        <div className="pricing-option-card">
          {plan === 'upfront' ? (
            <>
              <p className="pricing-option-card__price">${couponDiscount ? finalPrice : program.upfrontPrice} <span>one-time payment</span></p>
              {couponDiscount && <p style={{ fontSize: '0.78rem', color: '#16a34a', margin: '4px 0 0' }}>Save ${discount} with coupon!</p>}
            </>
          ) : (
            <>
              <p className="pricing-option-card__price">${couponDiscount ? finalPrice : program.installmentAmount} <span>/month</span></p>
              <p className="pricing-option-card__note">× {program.installmentMonths} months = ${program.installmentAmount * program.installmentMonths} total</p>
            </>
          )}
        </div>

        <div className="coupon-input-row">
          <input className="coupon-input" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }} placeholder="Coupon code (optional)" />
          <button className="coupon-apply-btn" onClick={handleApplyCoupon}><Tag size={13} /> Apply</button>
        </div>
        {couponDiscount && <div className="coupon-discount"><Check size={12} /> Coupon applied!</div>}
        {couponError && <div className="coupon-error">{couponError}</div>}

        <div className="product-pricing-actions">
          <Link to={`/student/checkout/${program.productId}`} className="product-enroll-btn">
            Enroll Now <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* What's included */}
      <div style={{ background: '#fff', border: '1px solid #E0E7FF', borderRadius: 14, padding: '20px 22px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E1B4B', margin: '0 0 14px' }}>What's Included</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {INCLUDED.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.87rem', color: '#374151' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={15} style={{ color: '#3730A3' }} />
              </div>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming sessions from real data */}
      {upcomingSessions.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E0E7FF', borderRadius: 14, padding: '20px 22px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E1B4B', margin: '0 0 14px' }}>Upcoming Sessions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingSessions.map(s => {
              const d = new Date(s.scheduledAt)
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: '#F9FAFB', border: '1px solid #EEF2FF', borderRadius: 10 }}>
                  <div style={{ width: 44, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3730A3', textTransform: 'uppercase' }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1E1B4B', fontSize: '0.87rem' }}>{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{s.durationMinutes} min session</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
