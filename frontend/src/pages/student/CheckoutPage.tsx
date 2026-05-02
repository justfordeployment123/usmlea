import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Check, Tag, Users } from 'lucide-react'
import { getProgramById, validateCoupon, submitCheckout, getClassesForProduct } from '../../services/lmsApi'
import type { ProgramDetail, ClassOption } from '../../services/lmsApi'
import { useStudentAuth } from '../../context/StudentAuthContext'
import '../../styles/payment.css'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1E1B4B',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9CA3AF' },
    },
    invalid: { color: '#DC2626' },
  },
}

function CheckoutForm({ program, plan, couponCode, discount, total, classId }: {
  program: ProgramDetail
  plan: 'upfront' | 'installment'
  couponCode: string
  discount: number
  total: number
  classId: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError('')

    try {
      const { clientSecret, orderId } = await submitCheckout(
        program.productId,
        plan,
        discount > 0 ? couponCode : undefined,
        undefined,
        classId,
      )

      if (!clientSecret) throw new Error('No payment session returned.')

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found.')

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      })

      if (stripeError) {
        setError(stripeError.message ?? 'Payment failed. Please try again.')
        setSubmitting(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        navigate('/student/payment-success', {
          state: {
            orderId,
            programName: program.name,
            plan,
            total,
            discount,
            couponCode: discount > 0 ? couponCode : undefined,
            paidAt: new Date().toISOString(),
          },
        })
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="checkout-form-field" style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Card Details
        </label>
        <div style={{ padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#fff' }}>
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div style={{ fontSize: '0.82rem', color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        className="checkout-submit-btn"
        disabled={submitting || !stripe}
      >
        {submitting ? 'Processing…' : `Pay $${total}${plan === 'installment' ? '/mo' : ''}`}
      </button>
      <Link to="/student/classes" className="checkout-cancel">Cancel — Go Back</Link>
    </form>
  )
}

export default function CheckoutPage() {
  const { productId } = useParams<{ productId: string }>()
  const { user } = useStudentAuth()

  const [program, setProgram] = useState<ProgramDetail | null>(null)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [plan, setPlan] = useState<'upfront' | 'installment'>('upfront')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState<{ value: number; type: 'percentage' | 'fixed' } | null>(null)
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    if (!productId) return
    getProgramById(productId).then(p => { if (p) setProgram(p) })
    getClassesForProduct(productId).then(cls => {
      setClasses(cls)
      if (cls.length === 1) setSelectedClassId(cls[0].classId)
    })
  }, [productId])

  if (!program || !user) return <div style={{ padding: '2rem', color: '#6B7280' }}>Loading…</div>

  const basePrice = plan === 'upfront' ? program.upfrontPrice : program.installmentAmount
  const discount = couponDiscount
    ? couponDiscount.type === 'percentage'
      ? Math.round(basePrice * couponDiscount.value / 100)
      : Math.min(couponDiscount.value, basePrice)
    : 0
  const total = basePrice - discount

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

  const FEATURES = ['Live group sessions', 'All recorded sessions', 'Teacher chat', 'Notice board', 'Attendance tracking']
  const selectedClass = classes.find(c => c.classId === selectedClassId)

  return (
    <div style={{ padding: '24px 0' }}>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E1B4B', margin: '0 0 20px' }}>
        Complete Your Enrollment
      </h1>
      <div className="checkout-page" style={{ margin: 0 }}>
        {/* Order summary */}
        <div className="checkout-summary">
          <h2>Order Summary</h2>
          <div className="checkout-line"><span>{program.name}</span></div>
          {selectedClass && (
            <div className="checkout-line">
              <span>Batch</span>
              <span style={{ fontWeight: 600 }}>{selectedClass.name}</span>
            </div>
          )}
          <div className="checkout-line">
            <span>Plan</span>
            <span>{plan === 'upfront' ? 'Upfront payment' : `Installment ($${program.installmentAmount}/mo × ${program.installmentMonths}mo)`}</span>
          </div>
          <div className="checkout-line"><span>Subtotal</span><span>${basePrice}</span></div>
          {couponDiscount && (
            <div className="checkout-line checkout-line--discount">
              <span>Discount ({couponCode})</span><span>−${discount}</span>
            </div>
          )}
          <div className="checkout-line"><span>Total {plan === 'installment' ? '/ month' : ''}</span><span>${total}</span></div>
          <div className="checkout-features">
            {FEATURES.map(f => (
              <div key={f} className="checkout-feature">
                <Check size={13} style={{ color: '#16a34a', flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Payment form */}
        <div className="checkout-form-card">
          <h2>Payment Details</h2>

          {/* Class picker — only shown when multiple classes exist */}
          {classes.length > 1 && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Select Batch
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {classes.map(cls => (
                  <button
                    key={cls.classId}
                    type="button"
                    onClick={() => setSelectedClassId(cls.classId)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', border: `1.5px solid ${selectedClassId === cls.classId ? '#3730A3' : '#E5E7EB'}`,
                      borderRadius: 10, background: selectedClassId === cls.classId ? '#EEF2FF' : '#fff',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E1B4B' }}>{cls.name}</div>
                      {cls.teacherName && <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>Teacher: {cls.teacherName}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#6B7280' }}>
                      <Users size={12} /> {cls.enrolledCount} enrolled
                    </div>
                  </button>
                ))}
              </div>
              {!selectedClassId && (
                <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 6 }}>Please select a batch to continue.</div>
              )}
            </div>
          )}

          {classes.length === 0 && (
            <div style={{ fontSize: '0.82rem', color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              No batches are currently available for this program. Please check back later.
            </div>
          )}

          {/* Plan toggle */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 4, gap: 4, marginBottom: 16 }}>
            {(['upfront', 'installment'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => { setPlan(p); setCouponDiscount(null); setCouponCode('') }}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', background: plan === p ? '#fff' : 'none', color: plan === p ? '#1E1B4B' : '#6B7280', boxShadow: plan === p ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}
              >
                {p === 'upfront' ? `Upfront ($${program.upfrontPrice})` : `Installment ($${program.installmentAmount}/mo)`}
              </button>
            ))}
          </div>

          {plan === 'installment' && (
            <div style={{ fontSize: '0.78rem', color: '#6B7280', marginBottom: 14, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8 }}>
              ${program.installmentAmount}/month for {program.installmentMonths} months — total ${program.installmentAmount * program.installmentMonths}
            </div>
          )}

          {/* Coupon */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              <Tag size={12} /> Coupon Code
            </label>
            <div className="coupon-input-row">
              <input
                className="coupon-input"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                placeholder="e.g. STEP1SAVE20"
              />
              <button type="button" className="coupon-apply-btn" onClick={handleApplyCoupon}>Apply</button>
            </div>
            {couponDiscount && <div className="coupon-discount"><Check size={12} /> Coupon applied! Save ${discount}</div>}
            {couponError && <div className="coupon-error">{couponError}</div>}
          </div>

          {classes.length > 0 && selectedClassId && (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                program={program}
                plan={plan}
                couponCode={couponCode}
                discount={discount}
                total={total}
                classId={selectedClassId}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}
