import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useAffiliateAuth } from '../../context/AffiliateAuthContext'
import { getAffiliateReferrals } from '../../services/affiliateApi'
import type { AffiliateReferral } from '../../types/affiliate'
import '../../styles/affiliate.css'

export default function AffiliateReferralsPage() {
  const { affiliate } = useAffiliateAuth()
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'deactivated'>('all')

  useEffect(() => {
    if (!affiliate) return
    getAffiliateReferrals(affiliate.id).then(setReferrals)
  }, [affiliate])

  const filtered = referrals.filter(r => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentEmail.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || r.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="affiliate-page">
      <header className="affiliate-page-header">
        <div>
          <h1>My Referrals</h1>
          <p>All students referred through your code.</p>
        </div>
        <div className="affiliate-referrals-stats">
          <span className="affiliate-stat-chip affiliate-stat-chip--active">
            {referrals.filter(r => r.status === 'active').length} Active
          </span>
          <span className="affiliate-stat-chip affiliate-stat-chip--inactive">
            {referrals.filter(r => r.status === 'deactivated').length} Deactivated
          </span>
        </div>
      </header>

      <section className="affiliate-card">
        <div className="affiliate-table-controls">
          <div className="affiliate-search-wrap">
            <Search size={15} className="affiliate-search-icon" />
            <input
              type="text"
              className="affiliate-search"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="affiliate-filter-tabs">
            {(['all', 'active', 'deactivated'] as const).map(tab => (
              <button
                key={tab}
                className={`affiliate-filter-tab ${filter === tab ? 'affiliate-filter-tab--active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="affiliate-empty">No referrals found.</p>
        ) : (
          <div className="affiliate-table-wrap">
            <table className="affiliate-table affiliate-table--full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Total Paid</th>
                  <th>Commission Earned</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="affiliate-student-cell">
                        <span className="affiliate-student-name">{r.studentName}</span>
                        <span className="affiliate-student-email">{r.studentEmail}</span>
                      </div>
                    </td>
                    <td><span className="affiliate-plan-badge">{r.plan}</span></td>
                    <td>
                      <span className={`affiliate-status-badge affiliate-status-badge--${r.status}`}>
                        {r.status === 'active' ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="affiliate-date">{new Date(r.joinedAt).toLocaleDateString()}</td>
                    <td className="affiliate-amount">${r.totalPaid.toFixed(2)}</td>
                    <td className="affiliate-amount affiliate-amount--highlight">+${r.commissionEarned.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
