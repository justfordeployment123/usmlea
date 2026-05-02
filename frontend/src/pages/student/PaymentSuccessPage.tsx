import { CheckCircle2, Printer } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import '../../styles/payment.css'

interface ReceiptState {
  orderId: string
  programName: string
  plan: 'upfront' | 'installment'
  total: number
  discount: number
  couponCode?: string
  paidAt: string
}

export default function PaymentSuccessPage() {
  const location = useLocation()
  const state = location.state as ReceiptState | null

  const programName = state?.programName ?? 'Your Program'
  const total = state?.total ?? 0
  const plan = state?.plan ?? 'upfront'
  const paidAt = state?.paidAt ? new Date(state.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString()
  const orderId = state?.orderId ?? '—'

  function handlePrintReceipt() {
    const w = window.open('', '_blank', 'width=600,height=700')
    if (!w) return
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt — ${programName}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 1.3rem; margin-bottom: 4px; }
          .subtitle { color: #6B7280; font-size: 0.85rem; margin-bottom: 32px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          td { padding: 8px 0; font-size: 0.9rem; }
          td:last-child { text-align: right; font-weight: 600; }
          .divider { border-top: 1px solid #E5E7EB; margin: 12px 0; }
          .total td { font-size: 1rem; font-weight: 700; }
          .footer { font-size: 0.75rem; color: #9CA3AF; margin-top: 32px; }
        </style>
      </head>
      <body>
        <h1>NextGen Medical Mastery</h1>
        <div class="subtitle">Payment Receipt</div>
        <table>
          <tr><td>Order ID</td><td>${orderId}</td></tr>
          <tr><td>Date</td><td>${paidAt}</td></tr>
          <tr><td>Program</td><td>${programName}</td></tr>
          <tr><td>Plan</td><td>${plan === 'upfront' ? 'Upfront Payment' : 'Monthly Installment'}</td></tr>
          ${state?.discount ? `<tr><td>Coupon (${state.couponCode ?? ''})</td><td>−$${state.discount}</td></tr>` : ''}
        </table>
        <div class="divider"></div>
        <table class="total">
          <tr><td>Amount Paid</td><td>$${total}${plan === 'installment' ? '/mo' : ''}</td></tr>
        </table>
        <div class="footer">Thank you for enrolling with NextGen Medical Mastery.</div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `)
    w.document.close()
  }

  return (
    <div className="payment-success-page">
      <div className="payment-success-card">
        <div className="payment-success-check">
          <CheckCircle2 size={36} />
        </div>
        <h1>You're enrolled!</h1>
        <p style={{ fontWeight: 600, color: '#374151' }}>{programName}</p>
        <p style={{ fontSize: '0.82rem', color: '#6B7280' }}>
          {plan === 'upfront' ? 'Upfront payment' : 'Monthly installment'} — ${total}{plan === 'installment' ? '/mo' : ''}
        </p>
        <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 4 }}>
          Order #{orderId.slice(0, 8).toUpperCase()} · {paidAt}
        </p>
        <div className="payment-success-card__actions">
          <Link
            to="/student/classes"
            style={{ padding: '11px 24px', background: '#3730A3', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Go to My Classes
          </Link>
          <button
            style={{ padding: '11px 24px', background: '#fff', color: '#6B7280', border: '1px solid #C7D2FE', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onClick={handlePrintReceipt}
          >
            <Printer size={15} /> View Receipt
          </button>
        </div>
      </div>
    </div>
  )
}
