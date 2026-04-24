# Affiliate System — Complete Documentation

## Table of Contents
1. [Overview & User Flow](#1-overview--user-flow)
2. [Database Schema](#2-database-schema)
3. [Row Level Security (RLS)](#3-row-level-security-rls)
4. [Backend File Structure](#4-backend-file-structure)
5. [Changes to Existing Backend Files](#5-changes-to-existing-backend-files)
6. [New Backend Route Files](#6-new-backend-route-files)
7. [Every Endpoint — Request & Response](#7-every-endpoint--request--response)
8. [Stripe Integration — How Commissions Are Triggered](#8-stripe-integration--how-commissions-are-triggered)
9. [Frontend ↔ Backend Connection Guide](#9-frontend--backend-connection-guide)
10. [Frontend File Reference](#10-frontend-file-reference)
11. [Step-by-Step Implementation Order](#11-step-by-step-implementation-order)
12. [Testing Checklist](#12-testing-checklist)

---

## 1. Overview & User Flow

Affiliates are growth partners who refer students to the platform and earn a percentage commission on every payment those students make. The system has three participants:

### Admin
- Creates affiliate accounts (name, email, password, referral code, commission %)
- Views all affiliates, their pending balances, and referral counts
- Clicks "Mark Paid" after doing a manual bank transfer to the affiliate — this resets their pending balance to $0 and records a payout entry

### Affiliate
- Logs in at `/affiliate/login` with credentials given by admin
- Has a unique referral code (e.g. `SARAH20`) they share with students
- Dashboard shows: pending payout, total earned, total referrals, active students
- Referrals page: every student they referred with Active/Deactivated billing status
- Earnings page: full commission ledger (every transaction)

### Student
- On the `/student/upgrade` page, enters a referral code before purchasing
- Code is validated and **locked permanently** — cannot be changed after first use
- Code is stored in `localStorage` keyed by student user ID (`nextgen.student.referral.<userId>`)
- When Stripe payment is processed, the locked referral code is passed to the backend
- Backend records the commission: `payment_amount × affiliate.commission_pct / 100`

---

## 2. Database Schema

Run these SQL migrations in Supabase SQL Editor **in order**.

### Migration 003 — Affiliate Tables

```sql
-- ─── Step 1: Add 'affiliate' to the allowed roles ────────────────────────────
-- The profiles table uses a TEXT role column. No enum change needed.
-- The backend ROLE_TYPES array must also be updated (see Section 5).

-- ─── Step 2: Affiliate profile data ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliates (
  id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code   TEXT UNIQUE NOT NULL,
  commission_pct  NUMERIC(5,2) NOT NULL DEFAULT 20.00
    CONSTRAINT commission_pct_range CHECK (commission_pct >= 0 AND commission_pct <= 100),
  pending_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00
    CONSTRAINT pending_balance_non_negative CHECK (pending_balance >= 0),
  total_paid_out  NUMERIC(10,2) NOT NULL DEFAULT 0.00
    CONSTRAINT total_paid_out_non_negative CHECK (total_paid_out >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Step 3: Link students to affiliates ────────────────────────────────────
-- Stored on profiles — one affiliate per student, immutable after first set.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID
    REFERENCES affiliates(id) ON DELETE SET NULL;

-- ─── Step 4: Commission ledger ───────────────────────────────────────────────
-- One row per student payment that involved a referral code.
CREATE TABLE IF NOT EXISTS referral_conversions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id      UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_id TEXT NOT NULL,           -- Stripe PaymentIntent or Invoice ID
  amount_paid       NUMERIC(10,2) NOT NULL,  -- what the student paid in USD
  commission_earned NUMERIC(10,2) NOT NULL,  -- amount_paid × commission_pct / 100
  plan              TEXT NOT NULL,           -- 'basic' | 'standard' | 'premium'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Step 5: Payout history ──────────────────────────────────────────────────
-- One row every time admin clicks "Mark Paid".
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount       NUMERIC(10,2) NOT NULL,  -- the pending_balance at time of payout
  paid_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes        TEXT                     -- optional admin note (e.g. "Bank transfer ref #123")
);

-- ─── Step 6: Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_referral_conversions_affiliate ON referral_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_student   ON referral_conversions(student_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate    ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by           ON profiles(referred_by_affiliate_id)
  WHERE referred_by_affiliate_id IS NOT NULL;
```

### Table Relationships Summary

```
profiles (role = 'affiliate')
    ↓ 1:1
affiliates
    ↓ 1:many
referral_conversions   ← one row per student payment
affiliate_payouts      ← one row per admin "mark paid" action

profiles (role = 'student')
    referred_by_affiliate_id → affiliates.id   (set once, never changed)
```

---

## 3. Row Level Security (RLS)

```sql
-- Enable RLS on all new tables
ALTER TABLE affiliates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts    ENABLE ROW LEVEL SECURITY;

-- affiliates: affiliate can read their own row; admin can read all
CREATE POLICY "Affiliate reads own row" ON affiliates
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role full access on affiliates" ON affiliates
  FOR ALL USING (auth.role() = 'service_role');

-- referral_conversions: affiliate sees their own commissions
CREATE POLICY "Affiliate reads own conversions" ON referral_conversions
  FOR SELECT USING (affiliate_id = auth.uid());

CREATE POLICY "Service role full access on referral_conversions" ON referral_conversions
  FOR ALL USING (auth.role() = 'service_role');

-- affiliate_payouts: affiliate sees their own payouts
CREATE POLICY "Affiliate reads own payouts" ON affiliate_payouts
  FOR SELECT USING (affiliate_id = auth.uid());

CREATE POLICY "Service role full access on affiliate_payouts" ON affiliate_payouts
  FOR ALL USING (auth.role() = 'service_role');
```

> All backend endpoints use `supabaseServiceClient` (service role key) which bypasses RLS entirely.
> RLS only applies if you ever query from the frontend directly with the anon client — which this system does not do.

---

## 4. Backend File Structure

These are the files to create and modify:

```
backend/src/
├── config/
│   └── env.ts                  ← MODIFY: add 'affiliate' to ROLE_TYPES
├── types/
│   └── express.d.ts            ← MODIFY: add 'affiliate' to RoleType union
├── routes/
│   ├── auth.ts                 ← MODIFY: add POST /auth/affiliate/login
│   ├── affiliateAdmin.ts       ← CREATE: admin-side affiliate management
│   └── affiliatePortal.ts      ← CREATE: affiliate-side portal endpoints
├── app.ts                      ← MODIFY: mount new routers
└── sql/
    └── 003_affiliates.sql      ← CREATE: migration file (SQL from Section 2)
```

---

## 5. Changes to Existing Backend Files

### `backend/src/config/env.ts`

Add `'affiliate'` to the `ROLE_TYPES` array:

```typescript
// BEFORE:
export const ROLE_TYPES = ['student', 'admin'] as const

// AFTER:
export const ROLE_TYPES = ['student', 'admin', 'affiliate'] as const
```

This makes `RoleType = 'student' | 'admin' | 'affiliate'` and allows the `requireRole('affiliate')` middleware to work.

---

### `backend/src/types/express.d.ts`

No change needed — `RoleType` is imported from `env.ts`, so adding `'affiliate'` there automatically updates the type here.

---

### `backend/src/routes/auth.ts`

Add the affiliate login endpoint. Copy the pattern from the existing `authRouter.post('/auth/admin/login', ...)` but check for `role = 'affiliate'` and return the affiliate-specific fields:

```typescript
// Add this Zod schema at the top with the other schemas:
const affiliateLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// Add this route:
authRouter.post('/auth/affiliate/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = affiliateLoginSchema.parse(req.body)

    const { data, error } = await supabaseAnonClient.auth.signInWithPassword({
      email: parsed.email.trim().toLowerCase(),
      password: parsed.password,
    })

    if (error || !data.user || !data.session) {
      throw new HttpError(401, 'LOGIN_FAILED', error?.message ?? 'Invalid credentials')
    }

    // Fetch profile to verify role
    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile || profile.role !== 'affiliate') {
      throw new HttpError(403, 'ROLE_MISMATCH', 'This account is not an affiliate account')
    }

    // Fetch affiliate-specific data
    const { data: affiliate, error: affiliateError } = await supabaseServiceClient
      .from('affiliates')
      .select('referral_code, commission_pct')
      .eq('id', data.user.id)
      .single()

    if (affiliateError || !affiliate) {
      throw new HttpError(500, 'AFFILIATE_DATA_MISSING', 'Affiliate record not found')
    }

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile.full_name,        // add full_name to the select above
        role: 'affiliate',
        referralCode: affiliate.referral_code,
        commissionPct: Number(affiliate.commission_pct),
      },
      session: data.session,
    })
  } catch (error) {
    return next(error)
  }
})
```

> Note: Also add `full_name` to the profiles select: `.select('role, full_name')`

---

### `backend/src/app.ts`

Mount the two new routers:

```typescript
import { affiliateAdminRouter } from './routes/affiliateAdmin.js'
import { affiliatePortalRouter } from './routes/affiliatePortal.js'

// Add inside createApp(), after existing routers:
app.use('/api/v1', affiliateAdminRouter)
app.use('/api/v1', affiliatePortalRouter)
```

---

## 6. New Backend Route Files

### `backend/src/routes/affiliateAdmin.ts`

This file handles all **admin-side** affiliate management. Every endpoint requires admin role.

```typescript
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/httpError.js'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { supabaseServiceClient } from '../lib/supabase.js'

export const affiliateAdminRouter = Router()

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createAffiliateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  referralCode: z.string().min(2).max(20).regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only'),
  commissionPct: z.number().min(1).max(100),
})

// ─── GET /api/v1/admin/affiliates ─────────────────────────────────────────────
// Returns all affiliates with their stats.

affiliateAdminRouter.get(
  '/admin/affiliates',
  authenticateRequest,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('affiliates')
        .select(`
          id,
          referral_code,
          commission_pct,
          pending_balance,
          total_paid_out,
          created_at,
          profiles!inner(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      // Count referrals per affiliate using a subquery
      const affiliateIds = (data ?? []).map(a => a.id)

      const { data: referralCounts } = await supabaseServiceClient
        .from('profiles')
        .select('referred_by_affiliate_id')
        .in('referred_by_affiliate_id', affiliateIds)

      const { data: activeCounts } = await supabaseServiceClient
        .from('user_subscriptions')
        .select('user_id, profiles!inner(referred_by_affiliate_id)')
        .eq('status', 'active')
        .in('profiles.referred_by_affiliate_id', affiliateIds)

      const totalByAffiliate: Record<string, number> = {}
      const activeByAffiliate: Record<string, number> = {}

      ;(referralCounts ?? []).forEach(r => {
        const id = r.referred_by_affiliate_id
        if (id) totalByAffiliate[id] = (totalByAffiliate[id] ?? 0) + 1
      })
      ;(activeCounts ?? []).forEach(r => {
        const id = (r as any).profiles?.referred_by_affiliate_id
        if (id) activeByAffiliate[id] = (activeByAffiliate[id] ?? 0) + 1
      })

      const result = (data ?? []).map(a => ({
        id: a.id,
        name: (a.profiles as any).full_name,
        email: (a.profiles as any).email,
        referralCode: a.referral_code,
        commissionPct: Number(a.commission_pct),
        pendingBalance: Number(a.pending_balance),
        totalPaidOut: Number(a.total_paid_out),
        totalReferrals: totalByAffiliate[a.id] ?? 0,
        activeReferrals: activeByAffiliate[a.id] ?? 0,
        createdAt: a.created_at,
      }))

      return res.status(200).json({ affiliates: result })
    } catch (error) {
      return next(error)
    }
  },
)

// ─── POST /api/v1/admin/affiliates ───────────────────────────────────────────
// Creates a new affiliate. Uses service role to bypass email confirmation.

affiliateAdminRouter.post(
  '/admin/affiliates',
  authenticateRequest,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createAffiliateSchema.parse(req.body)
      const normalizedEmail = parsed.email.trim().toLowerCase()
      const normalizedCode = parsed.referralCode.toUpperCase().trim()

      // Check referral code uniqueness
      const { data: existing } = await supabaseServiceClient
        .from('affiliates')
        .select('id')
        .eq('referral_code', normalizedCode)
        .maybeSingle()

      if (existing) {
        throw new HttpError(409, 'CODE_TAKEN', 'This referral code is already in use')
      }

      // Create Supabase auth user — service role bypasses email confirmation
      const { data: authData, error: authError } = await supabaseServiceClient.auth.admin.createUser({
        email: normalizedEmail,
        password: parsed.password,
        email_confirm: true,   // mark as confirmed immediately
        user_metadata: { full_name: parsed.name },
      })

      if (authError || !authData.user) {
        throw new HttpError(400, 'CREATE_USER_FAILED', authError?.message ?? 'Failed to create user')
      }

      const userId = authData.user.id

      // Insert into profiles with role = 'affiliate'
      const { error: profileError } = await supabaseServiceClient
        .from('profiles')
        .insert({
          id: userId,
          email: normalizedEmail,
          full_name: parsed.name,
          role: 'affiliate',
        })

      if (profileError) {
        // Rollback: delete the auth user
        await supabaseServiceClient.auth.admin.deleteUser(userId)
        throw new HttpError(500, 'PROFILE_CREATE_FAILED', profileError.message)
      }

      // Insert into affiliates table
      const { error: affiliateError } = await supabaseServiceClient
        .from('affiliates')
        .insert({
          id: userId,
          referral_code: normalizedCode,
          commission_pct: parsed.commissionPct,
        })

      if (affiliateError) {
        // Rollback both
        await supabaseServiceClient.auth.admin.deleteUser(userId)
        throw new HttpError(500, 'AFFILIATE_CREATE_FAILED', affiliateError.message)
      }

      return res.status(201).json({
        affiliate: {
          id: userId,
          name: parsed.name,
          email: normalizedEmail,
          referralCode: normalizedCode,
          commissionPct: parsed.commissionPct,
          pendingBalance: 0,
          totalPaidOut: 0,
          totalReferrals: 0,
          activeReferrals: 0,
          createdAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      return next(error)
    }
  },
)

// ─── PATCH /api/v1/admin/affiliates/:id/mark-paid ────────────────────────────
// Records a payout and resets the affiliate's pending balance to 0.
// Call this AFTER doing the actual bank transfer.

affiliateAdminRouter.patch(
  '/admin/affiliates/:id/mark-paid',
  authenticateRequest,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const affiliateId = req.params.id

      // Get current pending balance
      const { data: affiliate, error: fetchError } = await supabaseServiceClient
        .from('affiliates')
        .select('pending_balance, total_paid_out')
        .eq('id', affiliateId)
        .single()

      if (fetchError || !affiliate) {
        throw new HttpError(404, 'AFFILIATE_NOT_FOUND', 'Affiliate not found')
      }

      const amount = Number(affiliate.pending_balance)
      if (amount <= 0) {
        throw new HttpError(400, 'NO_BALANCE', 'No pending balance to pay out')
      }

      // Record the payout
      const { error: payoutError } = await supabaseServiceClient
        .from('affiliate_payouts')
        .insert({
          affiliate_id: affiliateId,
          amount,
          notes: req.body.notes ?? null,
        })

      if (payoutError) throw new HttpError(500, 'PAYOUT_RECORD_FAILED', payoutError.message)

      // Reset pending balance, add to total_paid_out
      const { error: updateError } = await supabaseServiceClient
        .from('affiliates')
        .update({
          pending_balance: 0,
          total_paid_out: Number(affiliate.total_paid_out) + amount,
        })
        .eq('id', affiliateId)

      if (updateError) throw new HttpError(500, 'BALANCE_RESET_FAILED', updateError.message)

      return res.status(200).json({
        message: `Payout of $${amount.toFixed(2)} recorded successfully.`,
        amountPaid: amount,
      })
    } catch (error) {
      return next(error)
    }
  },
)
```

---

### `backend/src/routes/affiliatePortal.ts`

This file handles all **affiliate-facing** endpoints. Every endpoint requires affiliate role.

```typescript
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/httpError.js'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { supabaseServiceClient } from '../lib/supabase.js'

export const affiliatePortalRouter = Router()

// ─── GET /api/v1/affiliate/me ────────────────────────────────────────────────
// Returns the logged-in affiliate's profile + stats.

affiliatePortalRouter.get(
  '/affiliate/me',
  authenticateRequest,
  requireRole('affiliate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const affiliateId = req.auth!.userId

      const { data, error } = await supabaseServiceClient
        .from('affiliates')
        .select(`
          referral_code,
          commission_pct,
          pending_balance,
          total_paid_out,
          created_at,
          profiles!inner(full_name, email)
        `)
        .eq('id', affiliateId)
        .single()

      if (error || !data) throw new HttpError(404, 'NOT_FOUND', 'Affiliate not found')

      // Count referrals
      const { count: totalReferrals } = await supabaseServiceClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by_affiliate_id', affiliateId)

      // Count active referrals (students with active subscriptions)
      const { count: activeReferrals } = await supabaseServiceClient
        .from('user_subscriptions')
        .select('profiles!inner(*)', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('profiles.referred_by_affiliate_id', affiliateId)

      return res.status(200).json({
        profile: {
          id: affiliateId,
          name: (data.profiles as any).full_name,
          email: (data.profiles as any).email,
          referralCode: data.referral_code,
          commissionPct: Number(data.commission_pct),
          pendingBalance: Number(data.pending_balance),
          totalPaidOut: Number(data.total_paid_out),
          totalReferrals: totalReferrals ?? 0,
          activeReferrals: activeReferrals ?? 0,
          createdAt: data.created_at,
        },
      })
    } catch (error) {
      return next(error)
    }
  },
)

// ─── GET /api/v1/affiliate/referrals ─────────────────────────────────────────
// Returns all students referred by this affiliate.

affiliatePortalRouter.get(
  '/affiliate/referrals',
  authenticateRequest,
  requireRole('affiliate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const affiliateId = req.auth!.userId

      const { data: students, error } = await supabaseServiceClient
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('referred_by_affiliate_id', affiliateId)
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const studentIds = (students ?? []).map(s => s.id)

      // Get subscription status for each referred student
      const { data: subscriptions } = await supabaseServiceClient
        .from('user_subscriptions')
        .select('user_id, plan_id, status')
        .in('user_id', studentIds)

      const subMap: Record<string, { plan: string; status: string }> = {}
      ;(subscriptions ?? []).forEach(s => {
        subMap[s.user_id] = { plan: s.plan_id, status: s.status }
      })

      // Get total paid and commission earned per student
      const { data: conversions } = await supabaseServiceClient
        .from('referral_conversions')
        .select('student_id, amount_paid, commission_earned')
        .eq('affiliate_id', affiliateId)
        .in('student_id', studentIds)

      const paidMap: Record<string, { totalPaid: number; commissionEarned: number }> = {}
      ;(conversions ?? []).forEach(c => {
        if (!paidMap[c.student_id]) paidMap[c.student_id] = { totalPaid: 0, commissionEarned: 0 }
        paidMap[c.student_id].totalPaid += Number(c.amount_paid)
        paidMap[c.student_id].commissionEarned += Number(c.commission_earned)
      })

      const referrals = (students ?? []).map(s => ({
        id: s.id,
        studentName: s.full_name,
        studentEmail: s.email,
        plan: subMap[s.id]?.plan ?? 'none',
        status: subMap[s.id]?.status === 'active' ? 'active' : 'deactivated',
        joinedAt: s.created_at,
        totalPaid: paidMap[s.id]?.totalPaid ?? 0,
        commissionEarned: paidMap[s.id]?.commissionEarned ?? 0,
      }))

      return res.status(200).json({ referrals })
    } catch (error) {
      return next(error)
    }
  },
)

// ─── GET /api/v1/affiliate/earnings ──────────────────────────────────────────
// Returns the full commission ledger for this affiliate.

affiliatePortalRouter.get(
  '/affiliate/earnings',
  authenticateRequest,
  requireRole('affiliate'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const affiliateId = req.auth!.userId

      const { data, error } = await supabaseServiceClient
        .from('referral_conversions')
        .select(`
          id,
          amount_paid,
          commission_earned,
          plan,
          created_at,
          profiles!student_id(full_name)
        `)
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const earnings = (data ?? []).map(e => ({
        id: e.id,
        studentName: (e.profiles as any)?.full_name ?? 'Unknown',
        amountPaid: Number(e.amount_paid),
        commissionEarned: Number(e.commission_earned),
        plan: e.plan,
        createdAt: e.created_at,
      }))

      return res.status(200).json({ earnings })
    } catch (error) {
      return next(error)
    }
  },
)

// ─── POST /api/v1/affiliate/validate-code ────────────────────────────────────
// Public endpoint — students use this to check if a referral code is valid.
// No auth required.

const validateCodeSchema = z.object({ code: z.string().min(1) })

affiliatePortalRouter.post(
  '/affiliate/validate-code',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = validateCodeSchema.parse(req.body)
      const normalizedCode = parsed.code.toUpperCase().trim()

      const { data, error } = await supabaseServiceClient
        .from('affiliates')
        .select('id, profiles!inner(full_name)')
        .eq('referral_code', normalizedCode)
        .maybeSingle()

      if (error) throw new HttpError(500, 'LOOKUP_FAILED', error.message)

      if (!data) {
        return res.status(200).json({ valid: false })
      }

      return res.status(200).json({
        valid: true,
        affiliateName: (data.profiles as any).full_name,
      })
    } catch (error) {
      return next(error)
    }
  },
)
```

---

## 7. Every Endpoint — Request & Response

### `POST /api/v1/auth/affiliate/login`
No auth required.
```json
// Request
{ "email": "sarah@affiliate.com", "password": "secret123" }

// Response 200
{
  "user": {
    "id": "uuid",
    "email": "sarah@affiliate.com",
    "name": "Sarah Ahmed",
    "role": "affiliate",
    "referralCode": "SARAH20",
    "commissionPct": 20
  },
  "session": { "access_token": "...", "refresh_token": "..." }
}

// Error 401: { "error": { "code": "LOGIN_FAILED", "message": "Invalid credentials" } }
// Error 403: { "error": { "code": "ROLE_MISMATCH", "message": "This account is not an affiliate account" } }
```

---

### `GET /api/v1/admin/affiliates`
Requires: `Authorization: Bearer <admin_token>`
```json
// Response 200
{
  "affiliates": [
    {
      "id": "uuid",
      "name": "Sarah Ahmed",
      "email": "sarah@affiliate.com",
      "referralCode": "SARAH20",
      "commissionPct": 20,
      "pendingBalance": 340.00,
      "totalPaidOut": 1200.00,
      "totalReferrals": 18,
      "activeReferrals": 14,
      "createdAt": "2026-01-10T09:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/admin/affiliates`
Requires: `Authorization: Bearer <admin_token>`
```json
// Request
{
  "name": "Sarah Ahmed",
  "email": "sarah@affiliate.com",
  "password": "temporarypass123",
  "referralCode": "SARAH20",
  "commissionPct": 20
}

// Response 201
{ "affiliate": { ...same shape as GET list item... } }

// Error 409: { "error": { "code": "CODE_TAKEN", "message": "This referral code is already in use" } }
```

---

### `PATCH /api/v1/admin/affiliates/:id/mark-paid`
Requires: `Authorization: Bearer <admin_token>`
```json
// Request (optional)
{ "notes": "Bank transfer ref #TXN-123" }

// Response 200
{ "message": "Payout of $340.00 recorded successfully.", "amountPaid": 340.00 }

// Error 400: { "error": { "code": "NO_BALANCE", "message": "No pending balance to pay out" } }
// Error 404: { "error": { "code": "AFFILIATE_NOT_FOUND", "message": "Affiliate not found" } }
```

---

### `GET /api/v1/affiliate/me`
Requires: `Authorization: Bearer <affiliate_token>`
```json
// Response 200
{
  "profile": {
    "id": "uuid",
    "name": "Sarah Ahmed",
    "email": "sarah@affiliate.com",
    "referralCode": "SARAH20",
    "commissionPct": 20,
    "pendingBalance": 340.00,
    "totalPaidOut": 1200.00,
    "totalReferrals": 18,
    "activeReferrals": 14,
    "createdAt": "2026-01-10T09:00:00Z"
  }
}
```

---

### `GET /api/v1/affiliate/referrals`
Requires: `Authorization: Bearer <affiliate_token>`
```json
// Response 200
{
  "referrals": [
    {
      "id": "student-uuid",
      "studentName": "Omar Farooq",
      "studentEmail": "omar@example.com",
      "plan": "standard",
      "status": "active",
      "joinedAt": "2026-01-15T10:00:00Z",
      "totalPaid": 60.00,
      "commissionEarned": 12.00
    }
  ]
}
```

---

### `GET /api/v1/affiliate/earnings`
Requires: `Authorization: Bearer <affiliate_token>`
```json
// Response 200
{
  "earnings": [
    {
      "id": "conversion-uuid",
      "studentName": "Omar Farooq",
      "amountPaid": 30.00,
      "commissionEarned": 6.00,
      "plan": "Standard",
      "createdAt": "2026-02-15T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/affiliate/validate-code`
No auth required. Called by students on the upgrade page.
```json
// Request
{ "code": "SARAH20" }

// Response 200 (valid)
{ "valid": true, "affiliateName": "Sarah Ahmed" }

// Response 200 (invalid)
{ "valid": false }
```

---

## 8. Stripe Integration — How Commissions Are Triggered

This is the most critical part. Commissions are calculated **inside the Stripe webhook handler**, not on the frontend.

### The Flow

```
Student clicks "Purchase Standard" on /student/upgrade
    ↓
Frontend sends referral code (from localStorage) along with the plan to the backend
    ↓
Backend creates a Stripe PaymentIntent or Checkout Session
    ↓
Student completes payment in Stripe UI
    ↓
Stripe sends webhook event to POST /api/v1/webhooks/stripe
    ↓
Webhook handler processes payment.succeeded event
    ↓
Webhook looks up student's referred_by_affiliate_id from profiles
    ↓
If affiliate exists: calculates commission, inserts referral_conversion row, increments affiliates.pending_balance
```

### Step 1 — Store Referral Code Before Payment

When the student initiates payment, the frontend should send the referral code to the backend. The backend then:
1. Validates the code
2. Looks up the affiliate ID
3. Stores `referred_by_affiliate_id` on the student's `profiles` row (if not already set — immutable)

```typescript
// In the future POST /api/v1/student/purchase endpoint:
if (referralCode) {
  const { data: affiliate } = await supabaseServiceClient
    .from('affiliates')
    .select('id')
    .eq('referral_code', referralCode.toUpperCase())
    .maybeSingle()

  if (affiliate) {
    // Only set if not already set — one affiliate per student forever
    await supabaseServiceClient
      .from('profiles')
      .update({ referred_by_affiliate_id: affiliate.id })
      .eq('id', studentId)
      .is('referred_by_affiliate_id', null)  // only update if null
  }
}
```

### Step 2 — Webhook Calculates Commission

Inside the Stripe webhook handler, after confirming payment:

```typescript
// Inside POST /api/v1/webhooks/stripe, on payment_intent.succeeded:

const studentId = event.data.object.metadata.student_id   // set when creating PaymentIntent
const amountPaid = event.data.object.amount_received / 100 // Stripe uses cents
const planId = event.data.object.metadata.plan_id

// Look up if student was referred
const { data: studentProfile } = await supabaseServiceClient
  .from('profiles')
  .select('referred_by_affiliate_id')
  .eq('id', studentId)
  .single()

if (studentProfile?.referred_by_affiliate_id) {
  const affiliateId = studentProfile.referred_by_affiliate_id

  // Get commission rate
  const { data: affiliate } = await supabaseServiceClient
    .from('affiliates')
    .select('commission_pct')
    .eq('id', affiliateId)
    .single()

  const commissionEarned = amountPaid * Number(affiliate.commission_pct) / 100

  // Record the conversion
  await supabaseServiceClient
    .from('referral_conversions')
    .insert({
      affiliate_id: affiliateId,
      student_id: studentId,
      stripe_payment_id: event.data.object.id,
      amount_paid: amountPaid,
      commission_earned: commissionEarned,
      plan: planId,
    })

  // Increment pending balance
  await supabaseServiceClient.rpc('increment_affiliate_balance', {
    affiliate_id: affiliateId,
    amount: commissionEarned,
  })
}
```

### Step 3 — Supabase RPC for Safe Balance Increment

Create this function in Supabase to avoid race conditions:

```sql
CREATE OR REPLACE FUNCTION increment_affiliate_balance(affiliate_id UUID, amount NUMERIC)
RETURNS VOID AS $$
  UPDATE affiliates
  SET pending_balance = pending_balance + amount
  WHERE id = affiliate_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 9. Frontend ↔ Backend Connection Guide

The frontend is designed so that **only `src/services/affiliateApi.ts` needs to change** when connecting to the real backend. Every page and component reads from this service — nothing else needs to be touched.

### Step 1 — Update `AffiliateAuthContext.tsx`

The `login()` function currently calls `loginAffiliate()` from `affiliateApi.ts`. That function is already marked `// BACKEND SWAP`. Update it in `affiliateApi.ts`:

```typescript
// BEFORE (mock):
export async function loginAffiliate(email: string, password: string): Promise<AffiliateLoginResponse> {
  const affiliates = loadAffiliatesFromStorage()
  const match = affiliates.find(a => a.email === email && a.password === password)
  if (!match) throw new Error('Invalid email or password.')
  return { user: { ... }, accessToken: `mock-token-${match.id}` }
}

// AFTER (real):
export async function loginAffiliate(email: string, password: string): Promise<AffiliateLoginResponse> {
  const response = await apiRequest<{ user: AffiliateUser & { name: string }; session: { access_token: string } }>(
    '/auth/affiliate/login',
    { method: 'POST', body: { email, password } }
  )
  return {
    user: response.user,
    accessToken: response.session.access_token,
  }
}
```

The `AffiliateAuthContext` stores `accessToken` in localStorage. Pass it when calling authenticated endpoints.

### Step 2 — Update Each API Function

Each function in `affiliateApi.ts` is marked with `// BACKEND SWAP`. Here are all the swaps:

```typescript
// getAffiliateProfile — pass access token from session
export async function getAffiliateProfile(affiliateId: string, accessToken: string): Promise<AffiliateProfile> {
  const response = await apiRequest<{ profile: AffiliateProfile }>('/affiliate/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return response.profile
}

// getAffiliateReferrals
export async function getAffiliateReferrals(affiliateId: string, accessToken: string): Promise<AffiliateReferral[]> {
  const response = await apiRequest<{ referrals: AffiliateReferral[] }>('/affiliate/referrals', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return response.referrals
}

// getAffiliateEarnings
export async function getAffiliateEarnings(affiliateId: string, accessToken: string): Promise<EarningsEntry[]> {
  const response = await apiRequest<{ earnings: EarningsEntry[] }>('/affiliate/earnings', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return response.earnings
}

// adminGetAffiliates — use admin access token
export async function adminGetAffiliates(accessToken: string): Promise<AdminAffiliate[]> {
  const response = await apiRequest<{ affiliates: AdminAffiliate[] }>('/admin/affiliates', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return response.affiliates
}

// adminCreateAffiliate
export async function adminCreateAffiliate(payload: CreateAffiliatePayload, accessToken: string): Promise<AdminAffiliate> {
  const response = await apiRequest<{ affiliate: AdminAffiliate }>('/admin/affiliates', {
    method: 'POST',
    body: payload,
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return response.affiliate
}

// adminMarkAffiliatePaid
export async function adminMarkAffiliatePaid(affiliateId: string, accessToken: string): Promise<void> {
  await apiRequest('/admin/affiliates/' + affiliateId + '/mark-paid', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}

// validateAffiliateCode — no auth needed
export async function validateAffiliateCode(code: string): Promise<{ valid: boolean; affiliateName?: string }> {
  return apiRequest('/affiliate/validate-code', {
    method: 'POST',
    body: { code }
  })
}
```

### Step 3 — Pass Access Token from Context to Pages

Pages currently call e.g. `getAffiliateProfile(affiliate.id)`. After the swap, they need to pass the token. The `AffiliateAuthContext` already exposes `session`:

```typescript
// In AffiliateDashboardPage.tsx (and other affiliate pages):
const { affiliate, session } = useAffiliateAuth()

// Then:
getAffiliateProfile(affiliate.id, session!.accessToken).then(setProfile)
```

Similarly for admin pages, get the token from `AdminAuthContext`.

### Step 4 — Referral Code Sent at Purchase

In `UpgradePage.tsx`, the referral code is already stored in state (`referralCode`) when `handlePurchase()` is called. When Stripe is wired in, pass it to the purchase endpoint:

```typescript
const handlePurchase = async (plan: PlanId) => {
  // When Stripe is ready, send this to backend:
  await apiRequest('/student/purchase', {
    method: 'POST',
    body: { planId: plan, referralCode: codeStatus === 'valid' ? referralCode : null },
    headers: { Authorization: `Bearer ${session.accessToken}` }
  })
}
```

The backend purchase endpoint stores `referred_by_affiliate_id` on the student's profile (if not already set), then creates the Stripe PaymentIntent.

---

## 10. Frontend File Reference

| File | Purpose |
|------|---------|
| `src/types/affiliate.ts` | All TypeScript interfaces |
| `src/data/affiliates.ts` | Mock data + localStorage helpers (delete after backend is live) |
| `src/services/affiliateApi.ts` | **Only file to change on backend swap** |
| `src/context/AffiliateAuthContext.tsx` | Auth state, localStorage key: `nextgen.affiliate.auth` |
| `src/components/routing/AffiliateProtectedRoute.tsx` | Route guard — redirects to `/affiliate/login` if not logged in |
| `src/layouts/AffiliateLayout.tsx` + `.css` | Sidebar layout for affiliate portal |
| `src/pages/affiliate/auth/AffiliateLoginPage.tsx` | Login form |
| `src/pages/affiliate/AffiliateDashboardPage.tsx` | KPIs + recent earnings + referral overview |
| `src/pages/affiliate/AffiliateReferralsPage.tsx` | Full referrals table with search + filter |
| `src/pages/affiliate/AffiliateEarningsPage.tsx` | Commission ledger with totals |
| `src/pages/admin/AdminAffiliatesPage.tsx` | Create affiliates + view balances + mark paid |
| `src/pages/student/UpgradePage.tsx` | Referral code input — locked after first valid apply |
| `src/styles/affiliate.css` | Affiliate portal styles |
| `src/styles/admin-affiliates.css` | Admin affiliates page styles |

### Referral Code Lock (Student)

The referral code is stored in localStorage under key `nextgen.student.referral.<userId>` as:
```json
{ "code": "SARAH20", "affiliateName": "Sarah Ahmed" }
```
Once written it is read-only — the input becomes `readOnly` and the Apply button disappears. This lock is enforced at the DB level too: `referred_by_affiliate_id` is only updated when currently `NULL` (see Section 8).

---

## 11. Step-by-Step Implementation Order

Follow this exact order to avoid dependency issues:

1. **Run SQL migration** — `003_affiliates.sql` in Supabase SQL Editor
2. **Update `env.ts`** — add `'affiliate'` to `ROLE_TYPES`
3. **Create `backend/src/routes/affiliateAdmin.ts`** — admin endpoints
4. **Create `backend/src/routes/affiliatePortal.ts`** — affiliate portal endpoints
5. **Update `backend/src/routes/auth.ts`** — add affiliate login endpoint
6. **Update `backend/src/app.ts`** — mount new routers
7. **Test all endpoints with Postman/curl** (see Section 12)
8. **Implement Stripe webhook handler** — add commission calculation inside it
9. **Update `frontend/src/services/affiliateApi.ts`** — swap mock → real calls
10. **Update affiliate pages** — pass `accessToken` from context to service functions
11. **Delete `frontend/src/data/affiliates.ts`** — no longer needed
12. **End-to-end test** — full flow from admin creating affiliate → student using code → Stripe payment → commission appearing in portal

---

## 12. Testing Checklist

### Auth
- [ ] Admin creates affiliate → credentials work at `/affiliate/login`
- [ ] Affiliate login returns correct `referralCode` and `commissionPct`
- [ ] Student JWT cannot access `/affiliate/*` routes (403)
- [ ] Affiliate JWT cannot access `/admin/*` routes (403)
- [ ] Admin JWT cannot access `/affiliate/*` routes (403)

### Admin Panel
- [ ] `GET /admin/affiliates` returns correct pending balances and referral counts
- [ ] `POST /admin/affiliates` with duplicate email returns 409
- [ ] `POST /admin/affiliates` with duplicate referral code returns 409
- [ ] `PATCH /admin/affiliates/:id/mark-paid` resets balance to 0, records payout row
- [ ] `PATCH /admin/affiliates/:id/mark-paid` on zero balance returns 400

### Affiliate Portal
- [ ] `GET /affiliate/me` returns correct stats
- [ ] `GET /affiliate/referrals` shows only students referred by this affiliate
- [ ] `GET /affiliate/earnings` shows correct commission amounts
- [ ] `POST /affiliate/validate-code` returns valid for known code, invalid for unknown

### Student Upgrade Page
- [ ] Valid code shows affiliate name, locks input
- [ ] Invalid code shows error, does not lock
- [ ] Refreshing the page re-loads the locked code from localStorage
- [ ] A different student cannot use the same lock (keyed by userId)

### Commission Calculation (post-Stripe)
- [ ] Student payment triggers webhook
- [ ] `referral_conversions` row inserted with correct `commission_earned`
- [ ] Affiliate `pending_balance` incremented correctly
- [ ] Commission = `amount_paid × commission_pct / 100` (e.g. $30 × 20% = $6.00)
- [ ] Second payment from same student also generates commission
- [ ] Student without referral code generates no commission row
