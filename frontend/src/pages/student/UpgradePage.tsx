import { useState, useEffect } from 'react'
import { CheckCircle2, Clock3, Sparkles, Tag, CheckCheck, AlertCircle, Lock } from 'lucide-react'
import { useSubscription } from '../../context/SubscriptionContext'
import { useStudentAuth } from '../../context/StudentAuthContext'
import { getPlanDisplayName, type PlanId } from '../../types/subscription'
import { validateAffiliateCode } from '../../services/affiliateApi'
import '../../styles/billing.css'

function getReferralStorageKey(userId: string) {
  return `nextgen.student.referral.${userId}`
}

function getLockedReferral(userId: string): { code: string; affiliateName: string } | null {
  try {
    const raw = localStorage.getItem(getReferralStorageKey(userId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function lockReferral(userId: string, code: string, affiliateName: string) {
  localStorage.setItem(getReferralStorageKey(userId), JSON.stringify({ code, affiliateName }))
}

export default function UpgradePage() {
  const { billingSettings, snapshot, purchasePlan } = useSubscription()
  const { user } = useStudentAuth()

  const locked = user ? getLockedReferral(user.id) : null

  const [referralCode, setReferralCode] = useState('')
  const [codeStatus, setCodeStatus] = useState<'idle' | 'valid' | 'invalid' | 'checking'>('idle')
  const [affiliateName, setAffiliateName] = useState('')

  useEffect(() => {
    if (locked) {
      setReferralCode(locked.code)
      setAffiliateName(locked.affiliateName)
      setCodeStatus('valid')
    }
  }, [locked])

  const handleCodeCheck = async () => {
    if (locked) return
    const trimmed = referralCode.trim()
    if (!trimmed) return
    setCodeStatus('checking')
    const result = await validateAffiliateCode(trimmed)
    if (result.valid) {
      setCodeStatus('valid')
      setAffiliateName(result.affiliateName ?? '')
      if (user) lockReferral(user.id, trimmed, result.affiliateName ?? '')
    } else {
      setCodeStatus('invalid')
      setAffiliateName('')
    }
  }

  const handlePurchase = (plan: PlanId) => {
    // referralCode is captured here — pass to Stripe payment intent when implemented
    purchasePlan(plan)
  }

  return (
    <div className="billing-upgrade-page">
      <header className="billing-upgrade-header">
        <h1>
          <Sparkles size={20} /> Choose your prep plan
        </h1>
        <p>Demo Trial runs for 7 days. All paid plans provide 30 days of access per purchase cycle.</p>
      </header>

      {snapshot ? (
        <section className="billing-current-banner">
          <span>
            Current plan: <strong>{getPlanDisplayName(snapshot.entitlement.currentPlan, billingSettings)}</strong>
          </span>
          {snapshot.isCurrentPlanTimeBound ? (
            <span className="billing-countdown-chip">
              <Clock3 size={14} />
              {snapshot.isCurrentPlanExpired
                ? `${getPlanDisplayName(snapshot.entitlement.currentPlan, billingSettings)} expired`
                : `${snapshot.remainingDays} day(s) left in ${getPlanDisplayName(snapshot.entitlement.currentPlan, billingSettings)}`}
            </span>
          ) : null}
        </section>
      ) : null}

      <section className="billing-referral-section">
        <div className="billing-referral-header">
          <Tag size={16} />
          <span>Referral code</span>
          {locked && (
            <span className="billing-referral-locked-badge">
              <Lock size={11} /> Locked
            </span>
          )}
        </div>
        <div className="billing-referral-input-row">
          <input
            type="text"
            className={`billing-referral-input ${codeStatus === 'valid' ? 'billing-referral-input--valid' : codeStatus === 'invalid' ? 'billing-referral-input--invalid' : ''}`}
            placeholder="Enter code (e.g. SARAH20)"
            value={referralCode}
            onChange={e => {
              if (locked) return
              setReferralCode(e.target.value.toUpperCase())
              setCodeStatus('idle')
            }}
            onKeyDown={e => e.key === 'Enter' && !locked && handleCodeCheck()}
            readOnly={!!locked}
          />
          {!locked && (
            <button
              className="billing-referral-apply-btn"
              onClick={handleCodeCheck}
              disabled={!referralCode.trim() || codeStatus === 'checking'}
            >
              {codeStatus === 'checking' ? 'Checking...' : 'Apply'}
            </button>
          )}
        </div>
        {codeStatus === 'valid' && (
          <p className="billing-referral-feedback billing-referral-feedback--valid">
            <CheckCheck size={14} />
            {locked
              ? <>Referred by <strong>{affiliateName}</strong> — this cannot be changed.</>
              : <>Code applied — referred by <strong>{affiliateName}</strong></>}
          </p>
        )}
        {codeStatus === 'invalid' && (
          <p className="billing-referral-feedback billing-referral-feedback--invalid">
            <AlertCircle size={14} /> Invalid referral code. Please check and try again.
          </p>
        )}
      </section>

      <section className="billing-plan-grid">
        {billingSettings.plans.map(plan => (
          <article key={plan.id} className={`billing-plan-card ${plan.isMostPopular ? 'popular' : ''}`}>
            {plan.isMostPopular ? <span className="billing-popular-badge">Most Popular</span> : null}
            <div>
              <h3>{plan.name}</h3>
              <div className="billing-plan-price">${plan.monthlyPrice}/month</div>
            </div>

            <ul className="billing-feature-list">
              {plan.features.map(feature => (
                <li key={feature}>
                  <CheckCircle2 size={16} /> {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="billing-primary-btn"
              onClick={() => handlePurchase(plan.id)}
              disabled={snapshot?.entitlement.currentPlan === plan.id}
            >
              {snapshot?.entitlement.currentPlan === plan.id ? `Current plan: ${plan.name}` : `Purchase ${plan.name}`}
            </button>
          </article>
        ))}
      </section>

      <section className="card">
        <h3>Why upgrade now?</h3>
        <p>Based on your performance, you need focused prep. Unlock full analytics and your personalized long-form plan.</p>
      </section>
    </div>
  )
}
