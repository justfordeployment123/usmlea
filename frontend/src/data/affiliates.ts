import type { AdminAffiliate, AffiliateProfile, AffiliateReferral, EarningsEntry } from '../types/affiliate'

export interface MockAffiliateCredential {
  id: string
  email: string
  password: string
  name: string
  referralCode: string
  commissionPct: number
}

const AFFILIATES_STORE_KEY = 'nextgen.admin.affiliates'

export function loadAffiliatesFromStorage(): MockAffiliateCredential[] {
  try {
    const raw = localStorage.getItem(AFFILIATES_STORE_KEY)
    if (!raw) return getDefaultAffiliates()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : getDefaultAffiliates()
  } catch {
    return getDefaultAffiliates()
  }
}

export function saveAffiliatesToStorage(affiliates: MockAffiliateCredential[]) {
  localStorage.setItem(AFFILIATES_STORE_KEY, JSON.stringify(affiliates))
}

function getDefaultAffiliates(): MockAffiliateCredential[] {
  const defaults: MockAffiliateCredential[] = [
    {
      id: 'aff-001',
      email: 'sarah@affiliate.com',
      password: 'affiliate123',
      name: 'Sarah Ahmed',
      referralCode: 'SARAH20',
      commissionPct: 20,
    },
    {
      id: 'aff-002',
      email: 'malik@affiliate.com',
      password: 'affiliate123',
      name: 'Malik Hassan',
      referralCode: 'MALIK15',
      commissionPct: 15,
    },
  ]
  saveAffiliatesToStorage(defaults)
  return defaults
}

export function getMockAffiliateProfile(affiliateId: string): AffiliateProfile {
  const affiliates = loadAffiliatesFromStorage()
  const affiliate = affiliates.find(a => a.id === affiliateId)

  if (!affiliate) {
    return {
      id: affiliateId,
      name: 'Affiliate',
      email: '',
      referralCode: '',
      commissionPct: 20,
      pendingBalance: 0,
      totalPaidOut: 0,
      totalReferrals: 0,
      activeReferrals: 0,
      createdAt: new Date().toISOString(),
    }
  }

  const profiles: Record<string, Omit<AffiliateProfile, 'id' | 'name' | 'email' | 'referralCode' | 'commissionPct'>> = {
    'aff-001': {
      pendingBalance: 340,
      totalPaidOut: 1200,
      totalReferrals: 18,
      activeReferrals: 14,
      createdAt: '2026-01-10T09:00:00Z',
    },
    'aff-002': {
      pendingBalance: 112.5,
      totalPaidOut: 450,
      totalReferrals: 9,
      activeReferrals: 7,
      createdAt: '2026-02-05T11:00:00Z',
    },
  }

  const stats = profiles[affiliateId] ?? {
    pendingBalance: 0,
    totalPaidOut: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    createdAt: new Date().toISOString(),
  }

  return {
    id: affiliate.id,
    name: affiliate.name,
    email: affiliate.email,
    referralCode: affiliate.referralCode,
    commissionPct: affiliate.commissionPct,
    ...stats,
  }
}

export const MOCK_REFERRALS: Record<string, AffiliateReferral[]> = {
  'aff-001': [
    { id: 'ref-01', studentName: 'Omar Farooq', studentEmail: 'omar@example.com', plan: 'standard', status: 'active', joinedAt: '2026-01-15T10:00:00Z', totalPaid: 60, commissionEarned: 12 },
    { id: 'ref-02', studentName: 'Nadia Khan', studentEmail: 'nadia@example.com', plan: 'premium', status: 'active', joinedAt: '2026-01-20T10:00:00Z', totalPaid: 120, commissionEarned: 24 },
    { id: 'ref-03', studentName: 'Bilal Tariq', studentEmail: 'bilal@example.com', plan: 'basic', status: 'deactivated', joinedAt: '2026-01-25T10:00:00Z', totalPaid: 30, commissionEarned: 6 },
    { id: 'ref-04', studentName: 'Hina Mirza', studentEmail: 'hina@example.com', plan: 'standard', status: 'active', joinedAt: '2026-02-01T10:00:00Z', totalPaid: 60, commissionEarned: 12 },
    { id: 'ref-05', studentName: 'Zain Ul Abideen', studentEmail: 'zain@example.com', plan: 'premium', status: 'active', joinedAt: '2026-02-10T10:00:00Z', totalPaid: 60, commissionEarned: 12 },
    { id: 'ref-06', studentName: 'Ayesha Malik', studentEmail: 'ayesha@example.com', plan: 'standard', status: 'active', joinedAt: '2026-02-15T10:00:00Z', totalPaid: 60, commissionEarned: 12 },
    { id: 'ref-07', studentName: 'Rashid Hussain', studentEmail: 'rashid@example.com', plan: 'basic', status: 'active', joinedAt: '2026-03-01T10:00:00Z', totalPaid: 15, commissionEarned: 3 },
    { id: 'ref-08', studentName: 'Sana Javed', studentEmail: 'sana@example.com', plan: 'standard', status: 'deactivated', joinedAt: '2026-03-05T10:00:00Z', totalPaid: 30, commissionEarned: 6 },
  ],
  'aff-002': [
    { id: 'ref-09', studentName: 'Usman Ali', studentEmail: 'usman@example.com', plan: 'premium', status: 'active', joinedAt: '2026-02-08T10:00:00Z', totalPaid: 120, commissionEarned: 18 },
    { id: 'ref-10', studentName: 'Fatima Sheikh', studentEmail: 'fatima@example.com', plan: 'standard', status: 'active', joinedAt: '2026-02-20T10:00:00Z', totalPaid: 60, commissionEarned: 9 },
    { id: 'ref-11', studentName: 'Kamran Baig', studentEmail: 'kamran@example.com', plan: 'basic', status: 'deactivated', joinedAt: '2026-03-01T10:00:00Z', totalPaid: 15, commissionEarned: 2.25 },
  ],
}

export const MOCK_EARNINGS: Record<string, EarningsEntry[]> = {
  'aff-001': [
    { id: 'earn-01', studentName: 'Omar Farooq', amountPaid: 30, commissionEarned: 6, plan: 'Standard', createdAt: '2026-01-15T10:00:00Z' },
    { id: 'earn-02', studentName: 'Nadia Khan', amountPaid: 60, commissionEarned: 12, plan: 'Premium', createdAt: '2026-01-20T10:00:00Z' },
    { id: 'earn-03', studentName: 'Bilal Tariq', amountPaid: 15, commissionEarned: 3, plan: 'Basic', createdAt: '2026-01-25T10:00:00Z' },
    { id: 'earn-04', studentName: 'Omar Farooq', amountPaid: 30, commissionEarned: 6, plan: 'Standard', createdAt: '2026-02-15T10:00:00Z' },
    { id: 'earn-05', studentName: 'Nadia Khan', amountPaid: 60, commissionEarned: 12, plan: 'Premium', createdAt: '2026-02-20T10:00:00Z' },
    { id: 'earn-06', studentName: 'Hina Mirza', amountPaid: 30, commissionEarned: 6, plan: 'Standard', createdAt: '2026-02-01T10:00:00Z' },
    { id: 'earn-07', studentName: 'Zain Ul Abideen', amountPaid: 60, commissionEarned: 12, plan: 'Premium', createdAt: '2026-03-10T10:00:00Z' },
    { id: 'earn-08', studentName: 'Ayesha Malik', amountPaid: 30, commissionEarned: 6, plan: 'Standard', createdAt: '2026-03-15T10:00:00Z' },
  ],
  'aff-002': [
    { id: 'earn-09', studentName: 'Usman Ali', amountPaid: 60, commissionEarned: 9, plan: 'Premium', createdAt: '2026-02-08T10:00:00Z' },
    { id: 'earn-10', studentName: 'Fatima Sheikh', amountPaid: 30, commissionEarned: 4.5, plan: 'Standard', createdAt: '2026-02-20T10:00:00Z' },
    { id: 'earn-11', studentName: 'Kamran Baig', amountPaid: 15, commissionEarned: 2.25, plan: 'Basic', createdAt: '2026-03-01T10:00:00Z' },
    { id: 'earn-12', studentName: 'Usman Ali', amountPaid: 60, commissionEarned: 9, plan: 'Premium', createdAt: '2026-03-08T10:00:00Z' },
  ],
}

export function getAdminAffiliateList(): AdminAffiliate[] {
  const affiliates = loadAffiliatesFromStorage()
  return affiliates.map(a => {
    const profile = getMockAffiliateProfile(a.id)
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      referralCode: a.referralCode,
      commissionPct: a.commissionPct,
      pendingBalance: profile.pendingBalance,
      totalPaidOut: profile.totalPaidOut,
      totalReferrals: profile.totalReferrals,
      activeReferrals: profile.activeReferrals,
      createdAt: profile.createdAt,
    }
  })
}

const BALANCES_KEY = 'nextgen.admin.affiliate-balances'

export function getAffiliateBalance(affiliateId: string): number {
  try {
    const raw = localStorage.getItem(BALANCES_KEY)
    const map: Record<string, number> = raw ? JSON.parse(raw) : {}
    return map[affiliateId] ?? getMockAffiliateProfile(affiliateId).pendingBalance
  } catch {
    return 0
  }
}

export function markAffiliatePaid(affiliateId: string) {
  try {
    const raw = localStorage.getItem(BALANCES_KEY)
    const map: Record<string, number> = raw ? JSON.parse(raw) : {}
    map[affiliateId] = 0
    localStorage.setItem(BALANCES_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export function validateReferralCode(code: string): MockAffiliateCredential | null {
  const affiliates = loadAffiliatesFromStorage()
  return affiliates.find(a => a.referralCode.toUpperCase() === code.toUpperCase()) ?? null
}
