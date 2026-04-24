/**
 * Affiliate API service — all data access goes through here.
 *
 * Currently: returns mock data from src/data/affiliates.ts
 * When backend is ready: swap each function body to call apiRequest()
 * Nothing else in the codebase needs to change.
 */

import {
  getAdminAffiliateList,
  getAffiliateBalance,
  getMockAffiliateProfile,
  loadAffiliatesFromStorage,
  markAffiliatePaid,
  MOCK_EARNINGS,
  MOCK_REFERRALS,
  saveAffiliatesToStorage,
  validateReferralCode,
} from '../data/affiliates'
import type {
  AdminAffiliate,
  AffiliateProfile,
  AffiliateReferral,
  AffiliateUser,
  CreateAffiliatePayload,
  EarningsEntry,
} from '../types/affiliate'

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AffiliateLoginResponse {
  user: AffiliateUser
  accessToken: string
}

export async function loginAffiliate(email: string, password: string): Promise<AffiliateLoginResponse> {
  // BACKEND SWAP: POST /api/v1/auth/affiliate/login
  const affiliates = loadAffiliatesFromStorage()
  const match = affiliates.find(
    a => a.email.toLowerCase() === email.toLowerCase() && a.password === password,
  )
  if (!match) throw new Error('Invalid email or password.')

  return {
    user: {
      id: match.id,
      name: match.name,
      email: match.email,
      referralCode: match.referralCode,
      commissionPct: match.commissionPct,
    },
    accessToken: `mock-token-${match.id}`,
  }
}

// ─── Affiliate Portal ─────────────────────────────────────────────────────────

export async function getAffiliateProfile(affiliateId: string): Promise<AffiliateProfile> {
  // BACKEND SWAP: GET /api/v1/affiliate/me
  const profile = getMockAffiliateProfile(affiliateId)
  const balance = getAffiliateBalance(affiliateId)
  return { ...profile, pendingBalance: balance }
}

export async function getAffiliateReferrals(affiliateId: string): Promise<AffiliateReferral[]> {
  // BACKEND SWAP: GET /api/v1/affiliate/referrals
  return MOCK_REFERRALS[affiliateId] ?? []
}

export async function getAffiliateEarnings(affiliateId: string): Promise<EarningsEntry[]> {
  // BACKEND SWAP: GET /api/v1/affiliate/earnings
  return MOCK_EARNINGS[affiliateId] ?? []
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminGetAffiliates(): Promise<AdminAffiliate[]> {
  // BACKEND SWAP: GET /api/v1/admin/affiliates
  return getAdminAffiliateList().map(a => ({
    ...a,
    pendingBalance: getAffiliateBalance(a.id),
  }))
}

export async function adminCreateAffiliate(payload: CreateAffiliatePayload): Promise<AdminAffiliate> {
  // BACKEND SWAP: POST /api/v1/admin/affiliates
  const affiliates = loadAffiliatesFromStorage()

  const emailExists = affiliates.some(a => a.email.toLowerCase() === payload.email.toLowerCase())
  if (emailExists) throw new Error('An affiliate with this email already exists.')

  const codeExists = affiliates.some(
    a => a.referralCode.toUpperCase() === payload.referralCode.toUpperCase(),
  )
  if (codeExists) throw new Error('This referral code is already taken.')

  const newAffiliate = {
    id: `aff-${Date.now()}`,
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    name: payload.name.trim(),
    referralCode: payload.referralCode.toUpperCase().trim(),
    commissionPct: payload.commissionPct,
  }

  saveAffiliatesToStorage([...affiliates, newAffiliate])

  return {
    id: newAffiliate.id,
    name: newAffiliate.name,
    email: newAffiliate.email,
    referralCode: newAffiliate.referralCode,
    commissionPct: newAffiliate.commissionPct,
    pendingBalance: 0,
    totalPaidOut: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    createdAt: new Date().toISOString(),
  }
}

export async function adminMarkAffiliatePaid(affiliateId: string): Promise<void> {
  // BACKEND SWAP: PATCH /api/v1/admin/affiliates/:id/mark-paid
  markAffiliatePaid(affiliateId)
}

// ─── Student (referral code validation) ──────────────────────────────────────

export async function validateAffiliateCode(code: string): Promise<{ valid: boolean; affiliateName?: string }> {
  // BACKEND SWAP: POST /api/v1/affiliate/validate-code
  const match = validateReferralCode(code)
  if (!match) return { valid: false }
  return { valid: true, affiliateName: match.name }
}
