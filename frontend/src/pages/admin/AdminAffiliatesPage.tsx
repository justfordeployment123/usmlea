import { useEffect, useState } from 'react'
import { Plus, CheckCircle, X, Users, DollarSign, TrendingUp, Search } from 'lucide-react'
import { adminCreateAffiliate, adminGetAffiliates, adminMarkAffiliatePaid } from '../../services/affiliateApi'
import type { AdminAffiliate, CreateAffiliatePayload } from '../../types/affiliate'
import '../../styles/admin-affiliates.css'

const EMPTY_FORM: CreateAffiliatePayload = {
  name: '',
  email: '',
  password: '',
  referralCode: '',
  commissionPct: 20,
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CreateAffiliatePayload>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [paidId, setPaidId] = useState<string | null>(null)

  useEffect(() => {
    adminGetAffiliates().then(setAffiliates)
  }, [])

  const totalPending = affiliates.reduce((sum, a) => sum + a.pendingBalance, 0)
  const totalPaid = affiliates.reduce((sum, a) => sum + a.totalPaidOut, 0)
  const totalReferrals = affiliates.reduce((sum, a) => sum + a.totalReferrals, 0)

  const filtered = affiliates.filter(
    a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.referralCode.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.referralCode.trim()) {
      setFormError('All fields are required.')
      return
    }
    if (form.commissionPct < 1 || form.commissionPct > 100) {
      setFormError('Commission must be between 1% and 100%.')
      return
    }
    try {
      setFormLoading(true)
      const created = await adminCreateAffiliate(form)
      setAffiliates(prev => [created, ...prev])
      setShowModal(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create affiliate.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleMarkPaid = async (affiliateId: string) => {
    await adminMarkAffiliatePaid(affiliateId)
    setPaidId(affiliateId)
    setAffiliates(prev =>
      prev.map(a => (a.id === affiliateId ? { ...a, pendingBalance: 0, totalPaidOut: a.totalPaidOut + a.pendingBalance } : a)),
    )
    setTimeout(() => setPaidId(null), 2000)
  }

  return (
    <div className="admin-affiliates-page">
      <header className="admin-metrics-header">
        <h1>Affiliates</h1>
        <p>Manage growth partners, referral codes, and commission payouts.</p>
      </header>

      <section className="admin-affiliates-kpis">
        <article className="admin-affiliates-kpi">
          <div className="admin-affiliates-kpi__icon"><Users size={18} /></div>
          <div>
            <p className="admin-affiliates-kpi__label">Total Affiliates</p>
            <p className="admin-affiliates-kpi__value">{affiliates.length}</p>
          </div>
        </article>
        <article className="admin-affiliates-kpi">
          <div className="admin-affiliates-kpi__icon admin-affiliates-kpi__icon--green"><DollarSign size={18} /></div>
          <div>
            <p className="admin-affiliates-kpi__label">Total Pending Payout</p>
            <p className="admin-affiliates-kpi__value">${totalPending.toFixed(2)}</p>
          </div>
        </article>
        <article className="admin-affiliates-kpi">
          <div className="admin-affiliates-kpi__icon admin-affiliates-kpi__icon--blue"><TrendingUp size={18} /></div>
          <div>
            <p className="admin-affiliates-kpi__label">Total Paid Out</p>
            <p className="admin-affiliates-kpi__value">${totalPaid.toFixed(2)}</p>
          </div>
        </article>
        <article className="admin-affiliates-kpi">
          <div className="admin-affiliates-kpi__icon admin-affiliates-kpi__icon--navy"><Users size={18} /></div>
          <div>
            <p className="admin-affiliates-kpi__label">Total Referrals</p>
            <p className="admin-affiliates-kpi__value">{totalReferrals}</p>
          </div>
        </article>
      </section>

      <section className="admin-affiliates-table-section card">
        <div className="admin-affiliates-table-header">
          <div className="affiliate-search-wrap">
            <Search size={15} className="affiliate-search-icon" />
            <input
              type="text"
              className="affiliate-search"
              placeholder="Search by name, email, or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-affiliates-create-btn" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Affiliate
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="affiliate-empty">No affiliates found. Create one to get started.</p>
        ) : (
          <div className="affiliate-table-wrap">
            <table className="affiliate-table affiliate-table--full">
              <thead>
                <tr>
                  <th>Affiliate</th>
                  <th>Code</th>
                  <th>Commission</th>
                  <th>Referrals</th>
                  <th>Active</th>
                  <th>Pending Payout</th>
                  <th>Total Paid Out</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(affiliate => (
                  <tr key={affiliate.id}>
                    <td>
                      <div className="affiliate-student-cell">
                        <span className="affiliate-student-name">{affiliate.name}</span>
                        <span className="affiliate-student-email">{affiliate.email}</span>
                      </div>
                    </td>
                    <td><span className="affiliate-plan-badge">{affiliate.referralCode}</span></td>
                    <td>{affiliate.commissionPct}%</td>
                    <td>{affiliate.totalReferrals}</td>
                    <td>{affiliate.activeReferrals}</td>
                    <td className={affiliate.pendingBalance > 0 ? 'affiliate-amount affiliate-amount--highlight' : 'affiliate-date'}>
                      ${affiliate.pendingBalance.toFixed(2)}
                    </td>
                    <td className="affiliate-date">${affiliate.totalPaidOut.toFixed(2)}</td>
                    <td>
                      {affiliate.pendingBalance > 0 ? (
                        <button
                          className={`admin-affiliates-pay-btn ${paidId === affiliate.id ? 'admin-affiliates-pay-btn--done' : ''}`}
                          onClick={() => handleMarkPaid(affiliate.id)}
                          disabled={paidId === affiliate.id}
                        >
                          {paidId === affiliate.id ? (
                            <><CheckCircle size={14} /> Marked Paid</>
                          ) : (
                            <>Mark Paid</>
                          )}
                        </button>
                      ) : (
                        <span className="admin-affiliates-paid-label">No balance</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="admin-affiliates-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-affiliates-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-affiliates-modal__header">
              <h3>Create Affiliate</h3>
              <button className="admin-affiliates-modal__close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && <div className="admin-affiliates-form-error">{formError}</div>}

            <form onSubmit={handleCreate} className="admin-affiliates-form">
              <div className="admin-affiliates-form__field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Ahmed"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="admin-affiliates-form__field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. sarah@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="admin-affiliates-form__field">
                <label>Password</label>
                <input
                  type="text"
                  placeholder="Temporary password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="admin-affiliates-form__row">
                <div className="admin-affiliates-form__field">
                  <label>Referral Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SARAH20"
                    value={form.referralCode}
                    onChange={e => setForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="admin-affiliates-form__field">
                  <label>Commission %</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.commissionPct}
                    onChange={e => setForm(f => ({ ...f, commissionPct: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="admin-affiliates-form__actions">
                <button type="button" className="admin-affiliates-form__cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-affiliates-form__submit" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Affiliate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
