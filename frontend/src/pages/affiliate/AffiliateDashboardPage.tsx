import { useEffect, useState } from 'react'
import { DollarSign, Users, UserCheck, TrendingUp, Copy, CheckCheck } from 'lucide-react'
import { useAffiliateAuth } from '../../context/AffiliateAuthContext'
import { getAffiliateEarnings, getAffiliateProfile, getAffiliateReferrals } from '../../services/affiliateApi'
import type { AffiliateProfile, AffiliateReferral, EarningsEntry } from '../../types/affiliate'
import '../../styles/affiliate.css'

export default function AffiliateDashboardPage() {
  const { affiliate } = useAffiliateAuth()
  const [profile, setProfile] = useState<AffiliateProfile | null>(null)
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([])
  const [earnings, setEarnings] = useState<EarningsEntry[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!affiliate) return
    getAffiliateProfile(affiliate.id).then(setProfile)
    getAffiliateReferrals(affiliate.id).then(setReferrals)
    getAffiliateEarnings(affiliate.id).then(setEarnings)
  }, [affiliate])

  const handleCopy = () => {
    if (!affiliate) return
    navigator.clipboard.writeText(affiliate.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const recentEarnings = earnings.slice(0, 5)

  return (
    <div className="affiliate-page">
      <header className="affiliate-page-header">
        <div>
          <h1>Welcome back, {affiliate?.name?.split(' ')[0]}</h1>
          <p>Here's how your referrals are performing.</p>
        </div>
        <button className="affiliate-copy-btn" onClick={handleCopy}>
          {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
          {copied ? 'Copied!' : affiliate?.referralCode}
        </button>
      </header>

      <section className="affiliate-kpi-grid">
        <article className="affiliate-kpi-card">
          <div className="affiliate-kpi-icon affiliate-kpi-icon--green">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="affiliate-kpi-label">Pending Payout</p>
            <p className="affiliate-kpi-value">${profile?.pendingBalance?.toFixed(2) ?? '0.00'}</p>
          </div>
        </article>

        <article className="affiliate-kpi-card">
          <div className="affiliate-kpi-icon affiliate-kpi-icon--blue">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="affiliate-kpi-label">Total Earned</p>
            <p className="affiliate-kpi-value">${((profile?.pendingBalance ?? 0) + (profile?.totalPaidOut ?? 0)).toFixed(2)}</p>
          </div>
        </article>

        <article className="affiliate-kpi-card">
          <div className="affiliate-kpi-icon affiliate-kpi-icon--navy">
            <Users size={18} />
          </div>
          <div>
            <p className="affiliate-kpi-label">Total Referrals</p>
            <p className="affiliate-kpi-value">{profile?.totalReferrals ?? 0}</p>
          </div>
        </article>

        <article className="affiliate-kpi-card">
          <div className="affiliate-kpi-icon affiliate-kpi-icon--teal">
            <UserCheck size={18} />
          </div>
          <div>
            <p className="affiliate-kpi-label">Active Students</p>
            <p className="affiliate-kpi-value">{profile?.activeReferrals ?? 0}</p>
          </div>
        </article>
      </section>

      <div className="affiliate-dash-grid">
        <section className="affiliate-card">
          <h3>Recent Earnings</h3>
          <p className="affiliate-card-sub">Latest commission transactions</p>
          {recentEarnings.length === 0 ? (
            <p className="affiliate-empty">No earnings yet. Share your referral code to get started.</p>
          ) : (
            <table className="affiliate-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Plan</th>
                  <th>Commission</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentEarnings.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.studentName}</td>
                    <td><span className="affiliate-plan-badge">{entry.plan}</span></td>
                    <td className="affiliate-amount">+${entry.commissionEarned.toFixed(2)}</td>
                    <td className="affiliate-date">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="affiliate-card">
          <h3>Referral Overview</h3>
          <p className="affiliate-card-sub">Status of your referred students</p>
          <div className="affiliate-overview-stats">
            <div className="affiliate-overview-stat">
              <span className="affiliate-overview-stat__label">Active</span>
              <span className="affiliate-overview-stat__value affiliate-overview-stat__value--active">
                {referrals.filter(r => r.status === 'active').length}
              </span>
            </div>
            <div className="affiliate-overview-stat">
              <span className="affiliate-overview-stat__label">Deactivated</span>
              <span className="affiliate-overview-stat__value affiliate-overview-stat__value--inactive">
                {referrals.filter(r => r.status === 'deactivated').length}
              </span>
            </div>
            <div className="affiliate-overview-stat">
              <span className="affiliate-overview-stat__label">Commission Rate</span>
              <span className="affiliate-overview-stat__value">
                {affiliate?.commissionPct ?? 0}%
              </span>
            </div>
            <div className="affiliate-overview-stat">
              <span className="affiliate-overview-stat__label">Paid Out</span>
              <span className="affiliate-overview-stat__value">
                ${profile?.totalPaidOut?.toFixed(2) ?? '0.00'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
