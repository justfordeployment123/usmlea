# LMS Backend Plan — First Half

## Table of Contents
1. [Overview & User Flows](#1-overview--user-flows)
2. [Database Schema](#2-database-schema)
3. [Row Level Security (RLS)](#3-row-level-security-rls)
4. [Backend File Structure](#4-backend-file-structure)
5. [Changes to Existing Backend Files](#5-changes-to-existing-backend-files)
6. [New Backend Route Files](#6-new-backend-route-files)
7. [Every Endpoint — Request & Response](#7-every-endpoint--request--response)
8. [Zoom API Integration](#8-zoom-api-integration)
9. [Frontend ↔ Backend Connection Guide](#9-frontend--backend-connection-guide)
10. [Frontend File Reference](#10-frontend-file-reference)
11. [Step-by-Step Implementation Order](#11-step-by-step-implementation-order)
12. [Testing Checklist](#12-testing-checklist)

---

## 1. Overview & User Flows

The LMS system revolves around **Products → Classes → Sessions**. A product is a program (e.g. "USMLE Step 1 Online Sessions"). A class is a cohort of students enrolled in that product, led by a teacher. Sessions are individual live Zoom meetings within a class.

### Admin
- Full system access
- Approves/rejects/suspends teachers after they register
- Creates editors (no public registration for editors)
- Manages products (create, edit, toggle active/inactive, delete)
- Views all sessions across all classes with override ability
- Controls demo access per student (extend days, grant full access, reset)

### Editor
- Created by admin only — no self-registration
- Can approve/reject pending teachers
- Views and manages all sessions across all classes
- Accesses supervision panel (chat monitoring — shell in first half, live in second half)

### Teacher
- Registers publicly → status starts as `pending`
- Redirected to a pending screen after login until admin/editor approves
- Once approved: manages their assigned classes and sessions
- Creates/edits/cancels sessions (edit requires a change note)
- Checks in to start a session (flips status to `live`)
- Ends sessions (flips to `completed`)
- Posts notices (announcements and PDF references) to their classes

### Student
- Enrolled in classes by admin (payment flow is second half)
- Sees their enrolled classes with countdown timers to next session
- Joins live sessions via Zoom link (link only shown when session is `live`)
- Reads class notice board

---

## 2. Database Schema

Run **Migration 004** in the Supabase SQL Editor. All tables are prefixed `lms_` to avoid conflicts.

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 004 — LMS Tables
-- Run in Supabase SQL Editor after migrations 001, 002, 003
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Teacher profiles ────────────────────────────────────────────────────────
-- One row per teacher. References profiles(id) for name/email/auth.
CREATE TABLE IF NOT EXISTS lms_teacher_profiles (
  id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  phone      TEXT NOT NULL DEFAULT '',
  bio        TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT teacher_status_values CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Editor profiles ─────────────────────────────────────────────────────────
-- One row per editor. Editors are created by admins only.
CREATE TABLE IF NOT EXISTS lms_editor_profiles (
  id                   UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  created_by_admin_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ────────────────────────────────────────────────────────────────
-- Each product is a program offering (e.g. "USMLE Step 1 Online Sessions").
CREATE TABLE IF NOT EXISTS lms_products (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  upfront_price      NUMERIC(10,2) NOT NULL DEFAULT 0.00
    CONSTRAINT upfront_price_non_negative CHECK (upfront_price >= 0),
  installment_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00
    CONSTRAINT installment_amount_non_negative CHECK (installment_amount >= 0),
  installment_months INTEGER NOT NULL DEFAULT 0
    CONSTRAINT installment_months_non_negative CHECK (installment_months >= 0),
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Classes ─────────────────────────────────────────────────────────────────
-- A class is a cohort of students for a product, assigned to one teacher.
-- ON DELETE RESTRICT on product_id and teacher_id prevents accidental deletion
-- of products/teachers that still have classes.
CREATE TABLE IF NOT EXISTS lms_classes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id               UUID NOT NULL REFERENCES lms_products(id) ON DELETE RESTRICT,
  name                     TEXT NOT NULL,
  description              TEXT NOT NULL DEFAULT '',
  teacher_id               UUID NOT NULL REFERENCES lms_teacher_profiles(id) ON DELETE RESTRICT,
  default_duration_minutes INTEGER NOT NULL DEFAULT 90
    CONSTRAINT duration_min CHECK (default_duration_minutes >= 15),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sessions ────────────────────────────────────────────────────────────────
-- One session = one live Zoom meeting for a class.
CREATE TABLE IF NOT EXISTS lms_sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id                UUID NOT NULL REFERENCES lms_classes(id) ON DELETE CASCADE,
  scheduled_at            TIMESTAMPTZ NOT NULL,
  duration_minutes        INTEGER NOT NULL DEFAULT 90
    CONSTRAINT session_duration_min CHECK (duration_minutes >= 15),
  status                  TEXT NOT NULL DEFAULT 'scheduled'
    CONSTRAINT session_status_values CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  meeting_link            TEXT NOT NULL DEFAULT '',  -- populated by Zoom API on creation
  recording_url           TEXT,                      -- populated after session ends
  attendance_count        INTEGER,                   -- populated when session ends
  actual_duration_minutes INTEGER,                   -- computed from started_at/ended_at
  change_note             TEXT,                      -- required if any field edited after creation
  started_at              TIMESTAMPTZ,               -- set when teacher checks in
  ended_at                TIMESTAMPTZ,               -- set when teacher or admin ends session
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notices ─────────────────────────────────────────────────────────────────
-- Announcements and PDF references posted to a class notice board.
CREATE TABLE IF NOT EXISTS lms_notices (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES lms_classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES lms_teacher_profiles(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  type       TEXT NOT NULL
    CONSTRAINT notice_type_values CHECK (type IN ('announcement', 'pdf')),
  file_name  TEXT,       -- display name of the attached file (UI only in first half)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Enrollments ─────────────────────────────────────────────────────────────
-- Links a student to a class. One row per student per class.
-- demo_expires_at = NULL means full (paid) access.
-- demo_expires_at = past timestamp means demo has expired.
-- demo_expires_at = future timestamp means demo still active.
CREATE TABLE IF NOT EXISTS lms_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id        UUID NOT NULL REFERENCES lms_classes(id) ON DELETE CASCADE,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  demo_expires_at TIMESTAMPTZ,
  CONSTRAINT enrollment_unique UNIQUE (student_id, class_id)
);

-- ─── Demo Overrides ──────────────────────────────────────────────────────────
-- Admin-controlled demo access per student.
-- One row per student (upserted on each override action).
-- This controls the demo_expires_at on ALL of that student's enrollments.
CREATE TABLE IF NOT EXISTS lms_demo_overrides (
  student_id             UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  demo_expires_at        TIMESTAMPTZ,  -- NULL = full access; past timestamp = expired
  overridden_by_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  overridden_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lms_classes_product     ON lms_classes(product_id);
CREATE INDEX IF NOT EXISTS idx_lms_classes_teacher     ON lms_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lms_sessions_class      ON lms_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_lms_sessions_status     ON lms_sessions(status);
CREATE INDEX IF NOT EXISTS idx_lms_sessions_scheduled  ON lms_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lms_notices_class       ON lms_notices(class_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_student ON lms_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_class   ON lms_enrollments(class_id);
```

### Table Relationships

```
profiles (role = 'teacher')
    ↓ 1:1
lms_teacher_profiles (status: pending → approved → suspended)
    ↓ 1:many
lms_classes
    ↓ 1:many
lms_sessions        ← one row per live Zoom session
lms_notices         ← announcements and PDF refs

profiles (role = 'editor')
    ↓ 1:1
lms_editor_profiles

lms_products
    ↓ 1:many
lms_classes

profiles (role = 'student')
    ↓ via lms_enrollments (many:many with lms_classes)
lms_classes
    ↓
lms_demo_overrides  ← admin-set demo expiry per student (latest override only)
```

---

## 3. Row Level Security (RLS)

```sql
-- Enable RLS on all LMS tables
ALTER TABLE lms_teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_editor_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_classes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_notices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_enrollments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_demo_overrides   ENABLE ROW LEVEL SECURITY;

-- Service role bypasses all RLS — all backend endpoints use supabaseServiceClient.
-- Policies below apply only if direct Supabase client queries are ever used.

-- lms_teacher_profiles: teacher reads own row
CREATE POLICY "Teacher reads own profile" ON lms_teacher_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role full access on lms_teacher_profiles" ON lms_teacher_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- lms_editor_profiles: editor reads own row
CREATE POLICY "Editor reads own profile" ON lms_editor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role full access on lms_editor_profiles" ON lms_editor_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- lms_products: public read (homepage uses products), service role writes
CREATE POLICY "Anyone can read active products" ON lms_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access on lms_products" ON lms_products
  FOR ALL USING (auth.role() = 'service_role');

-- lms_classes: teacher reads own classes; students read enrolled classes
CREATE POLICY "Teacher reads own classes" ON lms_classes
  FOR SELECT USING (
    teacher_id = auth.uid()
  );

CREATE POLICY "Student reads enrolled classes" ON lms_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lms_enrollments
      WHERE lms_enrollments.class_id = lms_classes.id
        AND lms_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on lms_classes" ON lms_classes
  FOR ALL USING (auth.role() = 'service_role');

-- lms_sessions: teacher sees sessions in their classes; student sees sessions in enrolled classes
CREATE POLICY "Teacher reads own class sessions" ON lms_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lms_classes
      WHERE lms_classes.id = lms_sessions.class_id
        AND lms_classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Student reads enrolled class sessions" ON lms_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lms_enrollments
      WHERE lms_enrollments.class_id = lms_sessions.class_id
        AND lms_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on lms_sessions" ON lms_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- lms_notices: same pattern as sessions
CREATE POLICY "Teacher reads own class notices" ON lms_notices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lms_classes
      WHERE lms_classes.id = lms_notices.class_id
        AND lms_classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Student reads enrolled class notices" ON lms_notices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lms_enrollments
      WHERE lms_enrollments.class_id = lms_notices.class_id
        AND lms_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on lms_notices" ON lms_notices
  FOR ALL USING (auth.role() = 'service_role');

-- lms_enrollments: student reads own enrollments
CREATE POLICY "Student reads own enrollments" ON lms_enrollments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Service role full access on lms_enrollments" ON lms_enrollments
  FOR ALL USING (auth.role() = 'service_role');

-- lms_demo_overrides: admin only via service role
CREATE POLICY "Service role full access on lms_demo_overrides" ON lms_demo_overrides
  FOR ALL USING (auth.role() = 'service_role');
```

> All backend routes use `supabaseServiceClient` (service role key) which bypasses RLS entirely. These policies are a safety net for any future direct frontend queries.

---

## 4. Backend File Structure

```
backend/src/
├── config/
│   └── env.ts                   ← MODIFY: add 'teacher', 'editor' to ROLE_TYPES
├── types/
│   └── express.d.ts             ← no change needed (imports RoleType from env.ts)
├── routes/
│   ├── auth.ts                  ← MODIFY: add teacher register/login, editor login
│   ├── lmsAdmin.ts              ← CREATE: admin LMS management
│   ├── lmsTeacher.ts            ← CREATE: teacher portal
│   ├── lmsEditor.ts             ← CREATE: editor portal
│   ├── lmsStudent.ts            ← CREATE: student LMS portal
│   └── lmsPublic.ts             ← CREATE: public products/classes listing
├── lib/
│   └── zoom.ts                  ← CREATE: Zoom API helper
├── app.ts                       ← MODIFY: mount 5 new routers
└── sql/
    └── 004_lms.sql              ← CREATE: migration file (SQL from Section 2)
```

---

## 5. Changes to Existing Backend Files

### `backend/src/config/env.ts`

Add `'teacher'` and `'editor'` to the `ROLE_TYPES` array:

```typescript
// BEFORE:
export const ROLE_TYPES = ['student', 'admin', 'affiliate'] as const

// AFTER:
export const ROLE_TYPES = ['student', 'admin', 'affiliate', 'teacher', 'editor'] as const
```

This makes `RoleType = 'student' | 'admin' | 'affiliate' | 'teacher' | 'editor'` and allows `requireRole('teacher')` and `requireRole('editor')` middleware to work.

---

### `backend/src/app.ts`

Import and mount the 5 new routers:

```typescript
import { lmsAdminRouter }   from './routes/lmsAdmin.js'
import { lmsTeacherRouter } from './routes/lmsTeacher.js'
import { lmsEditorRouter }  from './routes/lmsEditor.js'
import { lmsStudentRouter } from './routes/lmsStudent.js'
import { lmsPublicRouter }  from './routes/lmsPublic.js'

// Add inside createApp(), after existing routers:
app.use('/api/v1', lmsPublicRouter)   // no auth — products listing for homepage
app.use('/api/v1', lmsAdminRouter)
app.use('/api/v1', lmsTeacherRouter)
app.use('/api/v1', lmsEditorRouter)
app.use('/api/v1', lmsStudentRouter)
```

---

### `backend/src/routes/auth.ts`

Add three new endpoints — teacher register, teacher login, and editor login.

**Teacher Register:**
```typescript
const teacherRegisterSchema = z.object({
  fullName:  z.string().min(2),
  email:     z.string().email(),
  password:  z.string().min(8),
  phone:     z.string().min(5),
  bio:       z.string().min(10).max(300),
})

authRouter.post('/auth/teacher/register', async (req, res, next) => {
  try {
    const parsed = teacherRegisterSchema.parse(req.body)
    const normalizedEmail = parsed.email.trim().toLowerCase()

    // Create auth user via service role (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseServiceClient.auth.admin.createUser({
      email: normalizedEmail,
      password: parsed.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.fullName },
    })

    if (authError || !authData.user) {
      throw new HttpError(400, 'CREATE_USER_FAILED', authError?.message ?? 'Failed to create user')
    }

    const userId = authData.user.id

    // Insert into profiles with role = 'teacher'
    const { error: profileError } = await supabaseServiceClient
      .from('profiles')
      .insert({ id: userId, email: normalizedEmail, full_name: parsed.fullName, role: 'teacher' })

    if (profileError) {
      await supabaseServiceClient.auth.admin.deleteUser(userId)
      throw new HttpError(500, 'PROFILE_CREATE_FAILED', profileError.message)
    }

    // Insert into lms_teacher_profiles with status = 'pending'
    const { error: teacherError } = await supabaseServiceClient
      .from('lms_teacher_profiles')
      .insert({ id: userId, phone: parsed.phone, bio: parsed.bio, status: 'pending' })

    if (teacherError) {
      await supabaseServiceClient.auth.admin.deleteUser(userId)
      throw new HttpError(500, 'TEACHER_PROFILE_FAILED', teacherError.message)
    }

    return res.status(201).json({
      teacher: {
        id: userId,
        name: parsed.fullName,
        email: normalizedEmail,
        phone: parsed.phone,
        bio: parsed.bio,
        status: 'pending',
        registeredAt: new Date().toISOString(),
        assignedClassIds: [],
      },
    })
  } catch (err) {
    return next(err)
  }
})
```

**Teacher Login:**
```typescript
const teacherLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

authRouter.post('/auth/teacher/login', async (req, res, next) => {
  try {
    const parsed = teacherLoginSchema.parse(req.body)

    const { data, error } = await supabaseAnonClient.auth.signInWithPassword({
      email: parsed.email.trim().toLowerCase(),
      password: parsed.password,
    })

    if (error || !data.user || !data.session) {
      throw new HttpError(401, 'LOGIN_FAILED', 'Invalid email or password')
    }

    // Verify role and fetch teacher profile
    const { data: profile } = await supabaseServiceClient
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', data.user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new HttpError(403, 'ROLE_MISMATCH', 'This account is not a teacher account')
    }

    const { data: teacherProfile } = await supabaseServiceClient
      .from('lms_teacher_profiles')
      .select('phone, bio, status, created_at')
      .eq('id', data.user.id)
      .single()

    if (!teacherProfile) {
      throw new HttpError(500, 'TEACHER_DATA_MISSING', 'Teacher profile not found')
    }

    if (teacherProfile.status === 'suspended') {
      throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended. Contact support.')
    }

    // Fetch assigned class IDs
    const { data: classes } = await supabaseServiceClient
      .from('lms_classes')
      .select('id')
      .eq('teacher_id', data.user.id)

    return res.status(200).json({
      teacher: {
        id: data.user.id,
        name: profile.full_name,
        email: profile.email,
        phone: teacherProfile.phone,
        bio: teacherProfile.bio,
        status: teacherProfile.status,  // 'pending' or 'approved'
        registeredAt: teacherProfile.created_at,
        assignedClassIds: (classes ?? []).map(c => c.id),
      },
      session: data.session,
    })
  } catch (err) {
    return next(err)
  }
})
```

**Editor Login:**
```typescript
authRouter.post('/auth/editor/login', async (req, res, next) => {
  try {
    const parsed = teacherLoginSchema.parse(req.body)  // same schema: email + password

    const { data, error } = await supabaseAnonClient.auth.signInWithPassword({
      email: parsed.email.trim().toLowerCase(),
      password: parsed.password,
    })

    if (error || !data.user || !data.session) {
      throw new HttpError(401, 'LOGIN_FAILED', 'Invalid email or password')
    }

    const { data: profile } = await supabaseServiceClient
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', data.user.id)
      .single()

    if (!profile || profile.role !== 'editor') {
      throw new HttpError(403, 'ROLE_MISMATCH', 'This account is not an editor account')
    }

    const { data: editorProfile } = await supabaseServiceClient
      .from('lms_editor_profiles')
      .select('created_by_admin_id, created_at')
      .eq('id', data.user.id)
      .single()

    if (!editorProfile) {
      throw new HttpError(500, 'EDITOR_DATA_MISSING', 'Editor profile not found')
    }

    return res.status(200).json({
      editor: {
        id: data.user.id,
        name: profile.full_name,
        email: profile.email,
        createdAt: editorProfile.created_at,
        createdByAdminId: editorProfile.created_by_admin_id,
      },
      session: data.session,
    })
  } catch (err) {
    return next(err)
  }
})
```

---

## 6. New Backend Route Files

### `backend/src/lib/zoom.ts`

Handles Zoom meeting creation. In first half, uses a placeholder. When Zoom OAuth credentials are available, swap the placeholder with the real API call (documented below).

```typescript
// ZOOM API SWAP: Replace generateMeetingLink() body with the real Zoom API call.
// Zoom docs: https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/#operation/meetingCreate
// Auth: Server-to-Server OAuth app (Account Credentials grant)
//   1. Create a Server-to-Server OAuth app in Zoom Marketplace
//   2. Get Account ID, Client ID, Client Secret
//   3. Exchange for access token: POST https://zoom.us/oauth/token?grant_type=account_credentials&account_id=...
//   4. Use token in Authorization: Bearer <token>

export async function generateZoomMeetingLink(
  topic: string,
  scheduledAt: string,
  durationMinutes: number
): Promise<string> {
  // ── PLACEHOLDER (first half — no Zoom credentials needed yet) ────────────
  const id = Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000
  return `https://zoom.us/j/${id}`

  // ── REAL IMPLEMENTATION (swap in when Zoom app is set up) ────────────────
  // const tokenRes = await fetch(
  //   `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
  //   {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //     },
  //   }
  // )
  // const { access_token } = await tokenRes.json()
  //
  // const meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     topic,
  //     type: 2,                          // scheduled meeting
  //     start_time: scheduledAt,          // ISO 8601
  //     duration: durationMinutes,
  //     settings: { join_before_host: false, waiting_room: true },
  //   }),
  // })
  // const meeting = await meetingRes.json()
  // return meeting.join_url
}
```

---

### `backend/src/routes/lmsAdmin.ts`

All admin LMS management. Every endpoint requires admin role.

```typescript
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/httpError.js'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { supabaseServiceClient } from '../lib/supabase.js'
import { generateZoomMeetingLink } from '../lib/zoom.js'

export const lmsAdminRouter = Router()

// ─── Helper: build teacher response shape ────────────────────────────────────
async function fetchTeacherWithClasses(teacherId: string) {
  const { data: profile } = await supabaseServiceClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', teacherId)
    .single()

  const { data: tp } = await supabaseServiceClient
    .from('lms_teacher_profiles')
    .select('phone, bio, status, created_at')
    .eq('id', teacherId)
    .single()

  const { data: classes } = await supabaseServiceClient
    .from('lms_classes')
    .select('id')
    .eq('teacher_id', teacherId)

  return {
    id: teacherId,
    name: profile?.full_name ?? '',
    email: profile?.email ?? '',
    phone: tp?.phone ?? '',
    bio: tp?.bio ?? '',
    status: tp?.status ?? 'pending',
    registeredAt: tp?.created_at ?? '',
    assignedClassIds: (classes ?? []).map(c => c.id),
  }
}

// ─── GET /api/v1/admin/teachers ──────────────────────────────────────────────
lmsAdminRouter.get('/admin/teachers', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: teachers, error } = await supabaseServiceClient
        .from('lms_teacher_profiles')
        .select('id')
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const result = await Promise.all((teachers ?? []).map(t => fetchTeacherWithClasses(t.id)))
      return res.status(200).json({ teachers: result })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/admin/teachers/:id/approve ────────────────────────────────
lmsAdminRouter.patch('/admin/teachers/:id/approve', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_teacher_profiles')
        .update({ status: 'approved' })
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Teacher approved.' })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/admin/teachers/:id/reject ─────────────────────────────────
lmsAdminRouter.patch('/admin/teachers/:id/reject', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_teacher_profiles')
        .update({ status: 'suspended' })
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Teacher rejected.' })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/admin/teachers/:id/reinstate ──────────────────────────────
lmsAdminRouter.patch('/admin/teachers/:id/reinstate', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_teacher_profiles')
        .update({ status: 'approved' })
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Teacher reinstated.' })
    } catch (err) { return next(err) }
  }
)

// ─── POST /api/v1/admin/editors ──────────────────────────────────────────────
const createEditorSchema = z.object({
  fullName: z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
})

lmsAdminRouter.post('/admin/editors', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createEditorSchema.parse(req.body)
      const normalizedEmail = parsed.email.trim().toLowerCase()
      const adminId = req.auth!.userId

      const { data: authData, error: authError } = await supabaseServiceClient.auth.admin.createUser({
        email: normalizedEmail,
        password: parsed.password,
        email_confirm: true,
        user_metadata: { full_name: parsed.fullName },
      })

      if (authError || !authData.user) {
        throw new HttpError(400, 'CREATE_USER_FAILED', authError?.message ?? 'Failed to create user')
      }

      const userId = authData.user.id

      const { error: profileError } = await supabaseServiceClient
        .from('profiles')
        .insert({ id: userId, email: normalizedEmail, full_name: parsed.fullName, role: 'editor' })

      if (profileError) {
        await supabaseServiceClient.auth.admin.deleteUser(userId)
        throw new HttpError(500, 'PROFILE_CREATE_FAILED', profileError.message)
      }

      const { error: editorError } = await supabaseServiceClient
        .from('lms_editor_profiles')
        .insert({ id: userId, created_by_admin_id: adminId })

      if (editorError) {
        await supabaseServiceClient.auth.admin.deleteUser(userId)
        throw new HttpError(500, 'EDITOR_PROFILE_FAILED', editorError.message)
      }

      return res.status(201).json({
        editor: {
          id: userId,
          name: parsed.fullName,
          email: normalizedEmail,
          createdAt: new Date().toISOString(),
          createdByAdminId: adminId,
        },
      })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/admin/products ──────────────────────────────────────────────
lmsAdminRouter.get('/admin/products', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('lms_products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      // Count enrolled students per product via classes
      const productIds = (data ?? []).map(p => p.id)
      const { data: classes } = await supabaseServiceClient
        .from('lms_classes')
        .select('id, product_id')
        .in('product_id', productIds)

      const classIdsByProduct: Record<string, string[]> = {}
      ;(classes ?? []).forEach(c => {
        if (!classIdsByProduct[c.product_id]) classIdsByProduct[c.product_id] = []
        classIdsByProduct[c.product_id].push(c.id)
      })

      const { data: enrollments } = await supabaseServiceClient
        .from('lms_enrollments')
        .select('class_id')
        .in('class_id', (classes ?? []).map(c => c.id))

      const enrollmentsByClass: Record<string, number> = {}
      ;(enrollments ?? []).forEach(e => {
        enrollmentsByClass[e.class_id] = (enrollmentsByClass[e.class_id] ?? 0) + 1
      })

      const result = (data ?? []).map(p => {
        const myClassIds = classIdsByProduct[p.id] ?? []
        const enrolledCount = myClassIds.reduce((sum, cid) => sum + (enrollmentsByClass[cid] ?? 0), 0)
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          upfrontPrice: Number(p.upfront_price),
          installmentAmount: Number(p.installment_amount),
          installmentMonths: p.installment_months,
          isActive: p.is_active,
          classIds: myClassIds,
          enrolledStudentCount: enrolledCount,
          createdAt: p.created_at,
        }
      })

      return res.status(200).json({ products: result })
    } catch (err) { return next(err) }
  }
)

// ─── POST /api/v1/admin/products ─────────────────────────────────────────────
const createProductSchema = z.object({
  name:               z.string().min(2),
  description:        z.string().min(1),
  upfrontPrice:       z.number().min(0),
  installmentAmount:  z.number().min(0),
  installmentMonths:  z.number().int().min(0),
  isActive:           z.boolean().default(true),
})

lmsAdminRouter.post('/admin/products', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createProductSchema.parse(req.body)
      const { data, error } = await supabaseServiceClient
        .from('lms_products')
        .insert({
          name: parsed.name,
          description: parsed.description,
          upfront_price: parsed.upfrontPrice,
          installment_amount: parsed.installmentAmount,
          installment_months: parsed.installmentMonths,
          is_active: parsed.isActive,
        })
        .select()
        .single()

      if (error) throw new HttpError(500, 'CREATE_FAILED', error.message)

      return res.status(201).json({
        product: {
          id: data.id,
          name: data.name,
          description: data.description,
          upfrontPrice: Number(data.upfront_price),
          installmentAmount: Number(data.installment_amount),
          installmentMonths: data.installment_months,
          isActive: data.is_active,
          classIds: [],
          enrolledStudentCount: 0,
          createdAt: data.created_at,
        },
      })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/admin/products/:id ───────────────────────────────────────
lmsAdminRouter.patch('/admin/products/:id', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createProductSchema.partial().parse(req.body)
      const updates: Record<string, unknown> = {}
      if (parsed.name !== undefined)               updates.name = parsed.name
      if (parsed.description !== undefined)        updates.description = parsed.description
      if (parsed.upfrontPrice !== undefined)       updates.upfront_price = parsed.upfrontPrice
      if (parsed.installmentAmount !== undefined)  updates.installment_amount = parsed.installmentAmount
      if (parsed.installmentMonths !== undefined)  updates.installment_months = parsed.installmentMonths
      if (parsed.isActive !== undefined)           updates.is_active = parsed.isActive
      updates.updated_at = new Date().toISOString()

      const { error } = await supabaseServiceClient
        .from('lms_products')
        .update(updates)
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Product updated.' })
    } catch (err) { return next(err) }
  }
)

// ─── DELETE /api/v1/admin/products/:id ──────────────────────────────────────
lmsAdminRouter.delete('/admin/products/:id', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Guard: cannot delete if classes exist for this product
      const { count } = await supabaseServiceClient
        .from('lms_classes')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', req.params.id)

      if ((count ?? 0) > 0) {
        throw new HttpError(409, 'HAS_CLASSES', 'Cannot delete a product that has active classes.')
      }

      const { error } = await supabaseServiceClient
        .from('lms_products')
        .delete()
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'DELETE_FAILED', error.message)
      return res.status(200).json({ message: 'Product deleted.' })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/admin/sessions ──────────────────────────────────────────────
lmsAdminRouter.get('/admin/sessions', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('lms_sessions')
        .select(`
          *,
          lms_classes!inner(
            id, name, product_id,
            lms_teacher_profiles!inner(id),
            lms_products:lms_classes_product_id_fkey(name)
          )
        `)
        .order('scheduled_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      // Enrich with teacher name
      const teacherIds = [...new Set((data ?? []).map(s => (s.lms_classes as any).lms_teacher_profiles?.id).filter(Boolean))]
      const { data: profiles } = await supabaseServiceClient
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds)

      const nameMap: Record<string, string> = {}
      ;(profiles ?? []).forEach(p => { nameMap[p.id] = p.full_name })

      const result = (data ?? []).map(s => ({
        id: s.id,
        classId: s.class_id,
        className: (s.lms_classes as any).name,
        teacherId: (s.lms_classes as any).lms_teacher_profiles?.id,
        teacherName: nameMap[(s.lms_classes as any).lms_teacher_profiles?.id] ?? '',
        productName: (s.lms_classes as any).lms_products?.name ?? '',
        scheduledAt: s.scheduled_at,
        durationMinutes: s.duration_minutes,
        status: s.status,
        meetingLink: s.meeting_link,
        attendanceCount: s.attendance_count,
        actualDurationMinutes: s.actual_duration_minutes,
        changeNote: s.change_note,
        recordingUrl: s.recording_url,
      }))

      return res.status(200).json({ sessions: result })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/admin/sessions/:id ───────────────────────────────────────
const updateSessionSchema = z.object({
  scheduledAt:     z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).optional(),
  changeNote:      z.string().min(1),
})

lmsAdminRouter.patch('/admin/sessions/:id', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateSessionSchema.parse(req.body)
      const updates: Record<string, unknown> = { change_note: parsed.changeNote, updated_at: new Date().toISOString() }
      if (parsed.scheduledAt)     updates.scheduled_at = parsed.scheduledAt
      if (parsed.durationMinutes) updates.duration_minutes = parsed.durationMinutes

      const { error } = await supabaseServiceClient
        .from('lms_sessions')
        .update(updates)
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Session updated.' })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/admin/sessions/:id/cancel ─────────────────────────────────
lmsAdminRouter.patch('/admin/sessions/:id/cancel', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_sessions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .in('status', ['scheduled', 'live'])  // can only cancel scheduled or live sessions

      if (error) throw new HttpError(500, 'CANCEL_FAILED', error.message)
      return res.status(200).json({ message: 'Session cancelled.' })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/admin/demo-overrides ────────────────────────────────────────
lmsAdminRouter.get('/admin/demo-overrides', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('lms_demo_overrides')
        .select(`
          student_id, demo_expires_at, overridden_by_admin_id, overridden_at,
          profiles!student_id(full_name, email)
        `)
        .order('overridden_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const result = (data ?? []).map(o => ({
        studentId: o.student_id,
        studentName: (o.profiles as any)?.full_name ?? '',
        studentEmail: (o.profiles as any)?.email ?? '',
        demoExpiresAt: o.demo_expires_at,
        overriddenByAdminId: o.overridden_by_admin_id,
        overriddenAt: o.overridden_at,
      }))

      return res.status(200).json({ overrides: result })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/admin/students/:id/demo-override ──────────────────────────
const demoOverrideSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('extend'),      days: z.number().int().min(1).max(30) }),
  z.object({ type: z.literal('full_access') }),
  z.object({ type: z.literal('reset') }),
])

lmsAdminRouter.patch('/admin/students/:id/demo-override', authenticateRequest, requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const action = demoOverrideSchema.parse(req.body)
      const studentId = req.params.id
      const adminId = req.auth!.userId

      let demoExpiresAt: string | null
      if (action.type === 'full_access') {
        demoExpiresAt = null
      } else if (action.type === 'reset') {
        demoExpiresAt = new Date().toISOString()
      } else {
        const d = new Date()
        d.setDate(d.getDate() + action.days)
        demoExpiresAt = d.toISOString()
      }

      // Upsert demo override record
      const { error } = await supabaseServiceClient
        .from('lms_demo_overrides')
        .upsert({
          student_id: studentId,
          demo_expires_at: demoExpiresAt,
          overridden_by_admin_id: adminId,
          overridden_at: new Date().toISOString(),
        }, { onConflict: 'student_id' })

      if (error) throw new HttpError(500, 'OVERRIDE_FAILED', error.message)

      // Also update all enrollments for this student
      await supabaseServiceClient
        .from('lms_enrollments')
        .update({ demo_expires_at: demoExpiresAt })
        .eq('student_id', studentId)

      return res.status(200).json({
        override: { studentId, demoExpiresAt, overriddenByAdminId: adminId, overriddenAt: new Date().toISOString() },
      })
    } catch (err) { return next(err) }
  }
)
```

---

### `backend/src/routes/lmsTeacher.ts`

Teacher portal — classes, sessions, notices. Every endpoint requires teacher role.

```typescript
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/httpError.js'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { supabaseServiceClient } from '../lib/supabase.js'
import { generateZoomMeetingLink } from '../lib/zoom.js'

export const lmsTeacherRouter = Router()

// ─── GET /api/v1/teacher/classes ─────────────────────────────────────────────
lmsTeacherRouter.get('/teacher/classes', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.auth!.userId

      const { data: classes, error } = await supabaseServiceClient
        .from('lms_classes')
        .select(`
          id, name, description, default_duration_minutes, created_at,
          lms_products!inner(id, name)
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      // Get enrolled student counts
      const classIds = (classes ?? []).map(c => c.id)
      const { data: enrollments } = await supabaseServiceClient
        .from('lms_enrollments')
        .select('class_id')
        .in('class_id', classIds)

      const enrollCountByClass: Record<string, number> = {}
      ;(enrollments ?? []).forEach(e => {
        enrollCountByClass[e.class_id] = (enrollCountByClass[e.class_id] ?? 0) + 1
      })

      // Get next session per class
      const { data: sessions } = await supabaseServiceClient
        .from('lms_sessions')
        .select('id, class_id, scheduled_at, duration_minutes, status, meeting_link')
        .in('class_id', classIds)
        .in('status', ['scheduled', 'live'])
        .order('scheduled_at', { ascending: true })

      const nextSessionByClass: Record<string, typeof sessions[0]> = {}
      ;(sessions ?? []).forEach(s => {
        if (!nextSessionByClass[s.class_id]) nextSessionByClass[s.class_id] = s
      })

      const result = (classes ?? []).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        productId: (c.lms_products as any).id,
        productName: (c.lms_products as any).name,
        teacherId,
        defaultDurationMinutes: c.default_duration_minutes,
        enrolledStudentCount: enrollCountByClass[c.id] ?? 0,
        nextSession: nextSessionByClass[c.id] ?? null,
        createdAt: c.created_at,
      }))

      return res.status(200).json({ classes: result })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/teacher/classes/:classId/sessions ───────────────────────────
lmsTeacherRouter.get('/teacher/classes/:classId/sessions', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.auth!.userId

      // Verify teacher owns this class
      const { data: cls } = await supabaseServiceClient
        .from('lms_classes')
        .select('id')
        .eq('id', req.params.classId)
        .eq('teacher_id', teacherId)
        .single()

      if (!cls) throw new HttpError(403, 'FORBIDDEN', 'This class does not belong to you.')

      const { data, error } = await supabaseServiceClient
        .from('lms_sessions')
        .select('*')
        .eq('class_id', req.params.classId)
        .order('scheduled_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)
      return res.status(200).json({ sessions: data ?? [] })
    } catch (err) { return next(err) }
  }
)

// ─── POST /api/v1/teacher/sessions ───────────────────────────────────────────
const createSessionSchema = z.object({
  classId:         z.string().uuid(),
  scheduledAt:     z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(300),
  notes:           z.string().optional(),
})

lmsTeacherRouter.post('/teacher/sessions', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createSessionSchema.parse(req.body)
      const teacherId = req.auth!.userId

      // Verify teacher owns the class
      const { data: cls } = await supabaseServiceClient
        .from('lms_classes')
        .select('id, name')
        .eq('id', parsed.classId)
        .eq('teacher_id', teacherId)
        .single()

      if (!cls) throw new HttpError(403, 'FORBIDDEN', 'This class does not belong to you.')

      // Generate Zoom meeting link
      const meetingLink = await generateZoomMeetingLink(cls.name, parsed.scheduledAt, parsed.durationMinutes)

      const { data, error } = await supabaseServiceClient
        .from('lms_sessions')
        .insert({
          class_id: parsed.classId,
          scheduled_at: parsed.scheduledAt,
          duration_minutes: parsed.durationMinutes,
          meeting_link: meetingLink,
          status: 'scheduled',
        })
        .select()
        .single()

      if (error) throw new HttpError(500, 'CREATE_FAILED', error.message)
      return res.status(201).json({ session: data })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/teacher/sessions/:id ──────────────────────────────────────
const updateSessionSchema = z.object({
  scheduledAt:     z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(300).optional(),
  notes:           z.string().optional(),
  changeNote:      z.string().min(1),  // required on every edit
})

lmsTeacherRouter.patch('/teacher/sessions/:id', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateSessionSchema.parse(req.body)
      const teacherId = req.auth!.userId

      // Verify teacher owns the session's class
      const { data: session } = await supabaseServiceClient
        .from('lms_sessions')
        .select('class_id, status')
        .eq('id', req.params.id)
        .single()

      if (!session) throw new HttpError(404, 'NOT_FOUND', 'Session not found.')
      if (session.status === 'completed' || session.status === 'cancelled') {
        throw new HttpError(400, 'UNEDITABLE', 'Cannot edit a completed or cancelled session.')
      }

      const { data: cls } = await supabaseServiceClient
        .from('lms_classes')
        .select('id')
        .eq('id', session.class_id)
        .eq('teacher_id', teacherId)
        .single()

      if (!cls) throw new HttpError(403, 'FORBIDDEN', 'This session does not belong to your class.')

      const updates: Record<string, unknown> = { change_note: parsed.changeNote, updated_at: new Date().toISOString() }
      if (parsed.scheduledAt)     updates.scheduled_at = parsed.scheduledAt
      if (parsed.durationMinutes) updates.duration_minutes = parsed.durationMinutes

      const { error } = await supabaseServiceClient
        .from('lms_sessions')
        .update(updates)
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Session updated.' })
    } catch (err) { return next(err) }
  }
)

// ─── POST /api/v1/teacher/sessions/:id/start ─────────────────────────────────
// Teacher checks in — flips status to 'live'.
lmsTeacherRouter.post('/teacher/sessions/:id/start', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.auth!.userId

      const { data: session } = await supabaseServiceClient
        .from('lms_sessions')
        .select('class_id, status')
        .eq('id', req.params.id)
        .single()

      if (!session) throw new HttpError(404, 'NOT_FOUND', 'Session not found.')
      if (session.status !== 'scheduled') throw new HttpError(400, 'INVALID_STATUS', 'Session is not in scheduled state.')

      const { data: cls } = await supabaseServiceClient
        .from('lms_classes')
        .select('id')
        .eq('id', session.class_id)
        .eq('teacher_id', teacherId)
        .single()

      if (!cls) throw new HttpError(403, 'FORBIDDEN', 'This session does not belong to your class.')

      const { error } = await supabaseServiceClient
        .from('lms_sessions')
        .update({ status: 'live', started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)

      // TODO (second half): trigger push notification + email + WhatsApp to enrolled students

      return res.status(200).json({ message: 'Session started. Students will be notified.' })
    } catch (err) { return next(err) }
  }
)

// ─── POST /api/v1/teacher/sessions/:id/end ───────────────────────────────────
// Teacher ends session — flips to 'completed', computes actual duration.
lmsTeacherRouter.post('/teacher/sessions/:id/end', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.auth!.userId

      const { data: session } = await supabaseServiceClient
        .from('lms_sessions')
        .select('class_id, status, started_at')
        .eq('id', req.params.id)
        .single()

      if (!session) throw new HttpError(404, 'NOT_FOUND', 'Session not found.')
      if (session.status !== 'live') throw new HttpError(400, 'INVALID_STATUS', 'Session is not live.')

      const { data: cls } = await supabaseServiceClient
        .from('lms_classes')
        .select('id')
        .eq('id', session.class_id)
        .eq('teacher_id', teacherId)
        .single()

      if (!cls) throw new HttpError(403, 'FORBIDDEN', 'This session does not belong to your class.')

      const endedAt = new Date()
      const actualMinutes = session.started_at
        ? Math.round((endedAt.getTime() - new Date(session.started_at).getTime()) / 60000)
        : null

      const { error } = await supabaseServiceClient
        .from('lms_sessions')
        .update({
          status: 'completed',
          ended_at: endedAt.toISOString(),
          actual_duration_minutes: actualMinutes,
          updated_at: endedAt.toISOString(),
        })
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Session ended.', actualDurationMinutes: actualMinutes })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/teacher/sessions/:id/cancel ───────────────────────────────
lmsTeacherRouter.patch('/teacher/sessions/:id/cancel', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.auth!.userId

      const { data: session } = await supabaseServiceClient
        .from('lms_sessions')
        .select('class_id, status')
        .eq('id', req.params.id)
        .single()

      if (!session) throw new HttpError(404, 'NOT_FOUND', 'Session not found.')
      if (session.status !== 'scheduled') throw new HttpError(400, 'INVALID_STATUS', 'Only scheduled sessions can be cancelled.')

      const { data: cls } = await supabaseServiceClient
        .from('lms_classes')
        .select('id')
        .eq('id', session.class_id)
        .eq('teacher_id', teacherId)
        .single()

      if (!cls) throw new HttpError(403, 'FORBIDDEN', 'This session does not belong to your class.')

      const { error } = await supabaseServiceClient
        .from('lms_sessions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'CANCEL_FAILED', error.message)
      return res.status(200).json({ message: 'Session cancelled.' })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/teacher/classes/:classId/notices ────────────────────────────
lmsTeacherRouter.get('/teacher/classes/:classId/notices', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.auth!.userId

      const { data: cls } = await supabaseServiceClient
        .from('lms_classes')
        .select('id')
        .eq('id', req.params.classId)
        .eq('teacher_id', teacherId)
        .single()

      if (!cls) throw new HttpError(403, 'FORBIDDEN', 'This class does not belong to you.')

      const { data, error } = await supabaseServiceClient
        .from('lms_notices')
        .select('*')
        .eq('class_id', req.params.classId)
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)
      return res.status(200).json({ notices: data ?? [] })
    } catch (err) { return next(err) }
  }
)

// ─── POST /api/v1/teacher/notices ────────────────────────────────────────────
const createNoticeSchema = z.object({
  classId:  z.string().uuid(),
  title:    z.string().min(1),
  content:  z.string().default(''),
  type:     z.enum(['announcement', 'pdf']),
  fileName: z.string().optional(),
})

lmsTeacherRouter.post('/teacher/notices', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createNoticeSchema.parse(req.body)
      const teacherId = req.auth!.userId

      const { data: cls } = await supabaseServiceClient
        .from('lms_classes')
        .select('id')
        .eq('id', parsed.classId)
        .eq('teacher_id', teacherId)
        .single()

      if (!cls) throw new HttpError(403, 'FORBIDDEN', 'This class does not belong to you.')

      const { data, error } = await supabaseServiceClient
        .from('lms_notices')
        .insert({
          class_id: parsed.classId,
          teacher_id: teacherId,
          title: parsed.title,
          content: parsed.content,
          type: parsed.type,
          file_name: parsed.fileName ?? null,
        })
        .select()
        .single()

      if (error) throw new HttpError(500, 'CREATE_FAILED', error.message)
      return res.status(201).json({ notice: data })
    } catch (err) { return next(err) }
  }
)

// ─── DELETE /api/v1/teacher/notices/:id ──────────────────────────────────────
lmsTeacherRouter.delete('/teacher/notices/:id', authenticateRequest, requireRole('teacher'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.auth!.userId

      // Verify teacher owns this notice
      const { data: notice } = await supabaseServiceClient
        .from('lms_notices')
        .select('teacher_id')
        .eq('id', req.params.id)
        .single()

      if (!notice) throw new HttpError(404, 'NOT_FOUND', 'Notice not found.')
      if (notice.teacher_id !== teacherId) throw new HttpError(403, 'FORBIDDEN', 'This notice does not belong to you.')

      const { error } = await supabaseServiceClient
        .from('lms_notices')
        .delete()
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'DELETE_FAILED', error.message)
      return res.status(200).json({ message: 'Notice deleted.' })
    } catch (err) { return next(err) }
  }
)
```

---

### `backend/src/routes/lmsEditor.ts`

Editor portal — same powers as admin for sessions and teacher approval, but scoped to LMS only. No product management (admin only).

```typescript
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/httpError.js'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { supabaseServiceClient } from '../lib/supabase.js'

export const lmsEditorRouter = Router()

// Editor shares many endpoints with admin. Rather than duplicating, both admin
// and editor are checked with a helper middleware that accepts either role.
function requireAdminOrEditor(req: Request, res: Response, next: NextFunction) {
  const role = req.auth?.role
  if (role !== 'admin' && role !== 'editor') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin or editor required.' } })
  }
  return next()
}

// ─── GET /api/v1/editor/teachers ─────────────────────────────────────────────
// Editor can view and approve/reject teachers (same as admin).
lmsEditorRouter.get('/editor/teachers', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: teachers } = await supabaseServiceClient
        .from('lms_teacher_profiles')
        .select('id, status, phone, bio, created_at, profiles!inner(full_name, email)')
        .order('created_at', { ascending: false })

      const result = (teachers ?? []).map(t => ({
        id: t.id,
        name: (t.profiles as any).full_name,
        email: (t.profiles as any).email,
        phone: t.phone,
        bio: t.bio,
        status: t.status,
        registeredAt: t.created_at,
      }))

      return res.status(200).json({ teachers: result })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/editor/teachers/:id/approve ───────────────────────────────
lmsEditorRouter.patch('/editor/teachers/:id/approve', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_teacher_profiles')
        .update({ status: 'approved' })
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Teacher approved.' })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/editor/teachers/:id/reject ────────────────────────────────
lmsEditorRouter.patch('/editor/teachers/:id/reject', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_teacher_profiles')
        .update({ status: 'suspended' })
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Teacher rejected.' })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/editor/sessions ─────────────────────────────────────────────
// Editor sees all sessions across all classes (same data as admin).
// Reuse the same DB query — just a different route prefix and role check.
lmsEditorRouter.get('/editor/sessions', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('lms_sessions')
        .select(`
          *,
          lms_classes!inner(
            id, name,
            lms_teacher_profiles!inner(id),
            lms_products:lms_classes_product_id_fkey(name)
          )
        `)
        .order('scheduled_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const teacherIds = [...new Set((data ?? []).map(s => (s.lms_classes as any).lms_teacher_profiles?.id).filter(Boolean))]
      const { data: profiles } = await supabaseServiceClient
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds)

      const nameMap: Record<string, string> = {}
      ;(profiles ?? []).forEach(p => { nameMap[p.id] = p.full_name })

      const result = (data ?? []).map(s => ({
        id: s.id,
        classId: s.class_id,
        className: (s.lms_classes as any).name,
        teacherName: nameMap[(s.lms_classes as any).lms_teacher_profiles?.id] ?? '',
        productName: (s.lms_classes as any).lms_products?.name ?? '',
        scheduledAt: s.scheduled_at,
        durationMinutes: s.duration_minutes,
        status: s.status,
        attendanceCount: s.attendance_count,
        changeNote: s.change_note,
      }))

      return res.status(200).json({ sessions: result })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/editor/sessions/:id ───────────────────────────────────────
const updateSessionSchema = z.object({
  scheduledAt:     z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).optional(),
  changeNote:      z.string().min(1),
})

lmsEditorRouter.patch('/editor/sessions/:id', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateSessionSchema.parse(req.body)
      const updates: Record<string, unknown> = { change_note: parsed.changeNote, updated_at: new Date().toISOString() }
      if (parsed.scheduledAt)     updates.scheduled_at = parsed.scheduledAt
      if (parsed.durationMinutes) updates.duration_minutes = parsed.durationMinutes

      const { error } = await supabaseServiceClient
        .from('lms_sessions')
        .update(updates)
        .eq('id', req.params.id)

      if (error) throw new HttpError(500, 'UPDATE_FAILED', error.message)
      return res.status(200).json({ message: 'Session updated.' })
    } catch (err) { return next(err) }
  }
)

// ─── PATCH /api/v1/editor/sessions/:id/cancel ────────────────────────────────
lmsEditorRouter.patch('/editor/sessions/:id/cancel', authenticateRequest, requireRole('editor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseServiceClient
        .from('lms_sessions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .in('status', ['scheduled', 'live'])

      if (error) throw new HttpError(500, 'CANCEL_FAILED', error.message)
      return res.status(200).json({ message: 'Session cancelled.' })
    } catch (err) { return next(err) }
  }
)
```

---

### `backend/src/routes/lmsStudent.ts`

Student LMS portal — enrolled classes, sessions, notices.

```typescript
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { HttpError } from '../lib/httpError.js'
import { authenticateRequest, requireRole } from '../middleware/authenticate.js'
import { supabaseServiceClient } from '../lib/supabase.js'

export const lmsStudentRouter = Router()

// ─── GET /api/v1/student/classes ─────────────────────────────────────────────
// Returns all classes the student is enrolled in, enriched with next session.
lmsStudentRouter.get('/student/classes', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data: enrollments, error } = await supabaseServiceClient
        .from('lms_enrollments')
        .select(`
          class_id, enrolled_at, demo_expires_at,
          lms_classes!inner(
            id, name, description, default_duration_minutes,
            lms_products!inner(id, name),
            lms_teacher_profiles!inner(id)
          )
        `)
        .eq('student_id', studentId)

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const classIds = (enrollments ?? []).map(e => e.class_id)

      // Get next session per class
      const { data: sessions } = await supabaseServiceClient
        .from('lms_sessions')
        .select('id, class_id, scheduled_at, duration_minutes, status, meeting_link')
        .in('class_id', classIds)
        .in('status', ['scheduled', 'live'])
        .order('scheduled_at', { ascending: true })

      const nextSessionByClass: Record<string, typeof sessions[0]> = {}
      ;(sessions ?? []).forEach(s => {
        if (!nextSessionByClass[s.class_id]) nextSessionByClass[s.class_id] = s
      })

      // Get teacher names
      const teacherIds = [...new Set((enrollments ?? []).map(e => (e.lms_classes as any).lms_teacher_profiles?.id).filter(Boolean))]
      const { data: profiles } = await supabaseServiceClient
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds)

      const nameMap: Record<string, string> = {}
      ;(profiles ?? []).forEach(p => { nameMap[p.id] = p.full_name })

      const result = (enrollments ?? []).map(e => {
        const cls = e.lms_classes as any
        const teacherName = nameMap[cls.lms_teacher_profiles?.id] ?? ''
        return {
          id: cls.id,
          name: cls.name,
          description: cls.description,
          productId: cls.lms_products?.id,
          productName: cls.lms_products?.name ?? '',
          teacherName,
          defaultDurationMinutes: cls.default_duration_minutes,
          nextSession: nextSessionByClass[e.class_id] ?? null,
          enrolledAt: e.enrolled_at,
          demoExpiresAt: e.demo_expires_at,
        }
      })

      return res.status(200).json({ classes: result })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/classes/:classId ────────────────────────────────────
lmsStudentRouter.get('/student/classes/:classId', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      // Verify enrollment
      const { data: enrollment } = await supabaseServiceClient
        .from('lms_enrollments')
        .select('class_id')
        .eq('student_id', studentId)
        .eq('class_id', req.params.classId)
        .single()

      if (!enrollment) throw new HttpError(403, 'NOT_ENROLLED', 'You are not enrolled in this class.')

      const { data: cls, error } = await supabaseServiceClient
        .from('lms_classes')
        .select(`
          id, name, description, default_duration_minutes,
          lms_products!inner(name),
          lms_teacher_profiles!inner(id)
        `)
        .eq('id', req.params.classId)
        .single()

      if (error || !cls) throw new HttpError(404, 'NOT_FOUND', 'Class not found.')

      const { data: profile } = await supabaseServiceClient
        .from('profiles')
        .select('full_name')
        .eq('id', (cls.lms_teacher_profiles as any).id)
        .single()

      return res.status(200).json({
        class: {
          id: cls.id,
          name: cls.name,
          description: cls.description,
          productName: (cls.lms_products as any).name,
          teacherName: profile?.full_name ?? '',
          defaultDurationMinutes: cls.default_duration_minutes,
        },
      })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/classes/:classId/sessions ───────────────────────────
lmsStudentRouter.get('/student/classes/:classId/sessions', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data: enrollment } = await supabaseServiceClient
        .from('lms_enrollments')
        .select('class_id')
        .eq('student_id', studentId)
        .eq('class_id', req.params.classId)
        .single()

      if (!enrollment) throw new HttpError(403, 'NOT_ENROLLED', 'You are not enrolled in this class.')

      const { data, error } = await supabaseServiceClient
        .from('lms_sessions')
        .select('id, class_id, scheduled_at, duration_minutes, status, meeting_link')
        .eq('class_id', req.params.classId)
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      // Privacy: only expose meeting_link when session is live
      const sessions = (data ?? []).map(s => ({
        ...s,
        meetingLink: s.status === 'live' ? s.meeting_link : null,
      }))

      return res.status(200).json({ sessions })
    } catch (err) { return next(err) }
  }
)

// ─── GET /api/v1/student/classes/:classId/notices ────────────────────────────
lmsStudentRouter.get('/student/classes/:classId/notices', authenticateRequest, requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.auth!.userId

      const { data: enrollment } = await supabaseServiceClient
        .from('lms_enrollments')
        .select('class_id')
        .eq('student_id', studentId)
        .eq('class_id', req.params.classId)
        .single()

      if (!enrollment) throw new HttpError(403, 'NOT_ENROLLED', 'You are not enrolled in this class.')

      const { data, error } = await supabaseServiceClient
        .from('lms_notices')
        .select('id, class_id, title, content, type, file_name, created_at')
        .eq('class_id', req.params.classId)
        .order('created_at', { ascending: false })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)
      return res.status(200).json({ notices: data ?? [] })
    } catch (err) { return next(err) }
  }
)
```

---

### `backend/src/routes/lmsPublic.ts`

No auth required. Used by the public homepage to display products.

```typescript
import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { HttpError } from '../lib/httpError.js'
import { supabaseServiceClient } from '../lib/supabase.js'

export const lmsPublicRouter = Router()

// ─── GET /api/v1/products ────────────────────────────────────────────────────
// Returns all active products. Used by the public homepage.
lmsPublicRouter.get('/products',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('lms_products')
        .select('id, name, description, upfront_price, installment_amount, installment_months, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw new HttpError(500, 'FETCH_FAILED', error.message)

      const result = (data ?? []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        upfrontPrice: Number(p.upfront_price),
        installmentAmount: Number(p.installment_amount),
        installmentMonths: p.installment_months,
        isActive: p.is_active,
        createdAt: p.created_at,
      }))

      return res.status(200).json({ products: result })
    } catch (err) { return next(err) }
  }
)
```

---

## 7. Every Endpoint — Request & Response

### Auth

#### `POST /api/v1/auth/teacher/register`
No auth required.
```json
// Request
{
  "fullName": "Dr. James Carter",
  "email": "james@teacher.com",
  "password": "teacher123",
  "phone": "+1 555 0100",
  "bio": "Board-certified physician with 8 years of USMLE teaching experience."
}

// Response 201
{
  "teacher": {
    "id": "uuid",
    "name": "Dr. James Carter",
    "email": "james@teacher.com",
    "phone": "+1 555 0100",
    "bio": "Board-certified...",
    "status": "pending",
    "registeredAt": "2026-04-24T12:00:00Z",
    "assignedClassIds": []
  }
}

// Error 400: { "error": { "code": "CREATE_USER_FAILED", "message": "Email already in use" } }
```

#### `POST /api/v1/auth/teacher/login`
No auth required.
```json
// Request
{ "email": "james@teacher.com", "password": "teacher123" }

// Response 200
{
  "teacher": {
    "id": "uuid",
    "name": "Dr. James Carter",
    "email": "james@teacher.com",
    "phone": "+1 555 0100",
    "bio": "...",
    "status": "approved",         // or "pending" — frontend redirects pending to /teacher/pending
    "registeredAt": "2026-04-24T12:00:00Z",
    "assignedClassIds": ["class-uuid-1"]
  },
  "session": { "access_token": "...", "refresh_token": "..." }
}

// Error 401: { "error": { "code": "LOGIN_FAILED", "message": "Invalid email or password" } }
// Error 403: { "error": { "code": "ACCOUNT_SUSPENDED", "message": "Your account has been suspended." } }
// Error 403: { "error": { "code": "ROLE_MISMATCH", "message": "This account is not a teacher account" } }
```

#### `POST /api/v1/auth/editor/login`
No auth required.
```json
// Request
{ "email": "ali@editor.com", "password": "editor123" }

// Response 200
{
  "editor": {
    "id": "uuid",
    "name": "Ali Hassan",
    "email": "ali@editor.com",
    "createdAt": "2026-04-01T09:00:00Z",
    "createdByAdminId": "admin-uuid"
  },
  "session": { "access_token": "...", "refresh_token": "..." }
}
```

---

### Admin

#### `GET /api/v1/admin/teachers`
Requires `Authorization: Bearer <admin_token>`
```json
// Response 200
{
  "teachers": [
    {
      "id": "uuid",
      "name": "Dr. James Carter",
      "email": "james@teacher.com",
      "phone": "+1 555 0100",
      "bio": "...",
      "status": "approved",
      "registeredAt": "2026-04-24T12:00:00Z",
      "assignedClassIds": ["class-uuid"]
    }
  ]
}
```

#### `PATCH /api/v1/admin/teachers/:id/approve`
#### `PATCH /api/v1/admin/teachers/:id/reject`
#### `PATCH /api/v1/admin/teachers/:id/reinstate`
Requires admin token. No request body.
```json
// Response 200
{ "message": "Teacher approved." }
```

#### `POST /api/v1/admin/editors`
Requires admin token.
```json
// Request
{ "fullName": "Ali Hassan", "email": "ali@editor.com", "password": "editor123" }

// Response 201
{ "editor": { "id": "uuid", "name": "Ali Hassan", "email": "ali@editor.com", "createdAt": "...", "createdByAdminId": "uuid" } }
```

#### `GET /api/v1/admin/products`
```json
// Response 200
{
  "products": [
    {
      "id": "uuid",
      "name": "USMLE Online Sessions",
      "description": "Live sessions for Step 1 prep.",
      "upfrontPrice": 299.00,
      "installmentAmount": 99.00,
      "installmentMonths": 4,
      "isActive": true,
      "classIds": ["class-uuid"],
      "enrolledStudentCount": 15,
      "createdAt": "2026-04-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/v1/admin/products`
```json
// Request
{
  "name": "USMLE Online Sessions",
  "description": "Live expert-led sessions.",
  "upfrontPrice": 299,
  "installmentAmount": 99,
  "installmentMonths": 4,
  "isActive": true
}
// Response 201: { "product": { ...same shape as GET... } }
// Error 409: { "error": { "code": "HAS_CLASSES", "message": "Cannot delete a product that has active classes." } }
```

#### `PATCH /api/v1/admin/products/:id`
Partial update. Any subset of the create fields. Response 200.

#### `DELETE /api/v1/admin/products/:id`
```json
// Response 200: { "message": "Product deleted." }
// Error 409: { "error": { "code": "HAS_CLASSES", "message": "Cannot delete a product that has active classes." } }
```

#### `GET /api/v1/admin/sessions`
```json
// Response 200
{
  "sessions": [
    {
      "id": "uuid",
      "classId": "uuid",
      "className": "Step 1 Intensive",
      "teacherId": "uuid",
      "teacherName": "Dr. James Carter",
      "productName": "USMLE Online Sessions",
      "scheduledAt": "2026-04-25T10:00:00Z",
      "durationMinutes": 90,
      "status": "scheduled",
      "meetingLink": "https://zoom.us/j/1234567890",
      "attendanceCount": null,
      "actualDurationMinutes": null,
      "changeNote": null,
      "recordingUrl": null
    }
  ]
}
```

#### `PATCH /api/v1/admin/sessions/:id`
```json
// Request (changeNote is always required)
{ "scheduledAt": "2026-04-26T10:00:00Z", "durationMinutes": 120, "changeNote": "Rescheduled due to teacher conflict." }
// Response 200: { "message": "Session updated." }
```

#### `PATCH /api/v1/admin/sessions/:id/cancel`
No body. Response 200.

#### `GET /api/v1/admin/demo-overrides`
```json
// Response 200
{
  "overrides": [
    {
      "studentId": "uuid",
      "studentName": "Omar Farooq",
      "studentEmail": "omar@student.com",
      "demoExpiresAt": "2026-04-26T00:00:00Z",
      "overriddenByAdminId": "admin-uuid",
      "overriddenAt": "2026-04-24T14:00:00Z"
    }
  ]
}
```

#### `PATCH /api/v1/admin/students/:id/demo-override`
```json
// Request — extend
{ "type": "extend", "days": 7 }

// Request — full access
{ "type": "full_access" }

// Request — reset to expired
{ "type": "reset" }

// Response 200
{
  "override": {
    "studentId": "uuid",
    "demoExpiresAt": "2026-05-01T14:00:00Z",
    "overriddenByAdminId": "admin-uuid",
    "overriddenAt": "2026-04-24T14:00:00Z"
  }
}
```

---

### Teacher

#### `GET /api/v1/teacher/classes`
Requires teacher token.
```json
// Response 200
{
  "classes": [
    {
      "id": "uuid",
      "name": "Step 1 Intensive",
      "description": "...",
      "productId": "uuid",
      "productName": "USMLE Online Sessions",
      "teacherId": "uuid",
      "defaultDurationMinutes": 90,
      "enrolledStudentCount": 12,
      "nextSession": {
        "id": "uuid",
        "scheduledAt": "2026-04-25T10:00:00Z",
        "status": "scheduled"
      },
      "createdAt": "2026-04-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/v1/teacher/classes/:classId/sessions`
```json
// Response 200
{
  "sessions": [
    {
      "id": "uuid",
      "class_id": "uuid",
      "scheduled_at": "2026-04-25T10:00:00Z",
      "duration_minutes": 90,
      "status": "scheduled",
      "meeting_link": "https://zoom.us/j/...",
      "attendance_count": null,
      "actual_duration_minutes": null,
      "change_note": null
    }
  ]
}
```

#### `POST /api/v1/teacher/sessions`
```json
// Request
{ "classId": "uuid", "scheduledAt": "2026-04-25T10:00:00Z", "durationMinutes": 90 }
// Response 201: { "session": { ...full session row... } }
// Error 403: class doesn't belong to this teacher
```

#### `PATCH /api/v1/teacher/sessions/:id`
```json
// changeNote always required
{ "scheduledAt": "2026-04-26T10:00:00Z", "changeNote": "Moving to tomorrow due to public holiday." }
// Response 200: { "message": "Session updated." }
```

#### `POST /api/v1/teacher/sessions/:id/start`
No body. Flips status → `live`, sets `started_at`.
```json
// Response 200: { "message": "Session started. Students will be notified." }
// Error 400: { "code": "INVALID_STATUS", "message": "Session is not in scheduled state." }
```

#### `POST /api/v1/teacher/sessions/:id/end`
No body. Flips status → `completed`, computes `actual_duration_minutes`.
```json
// Response 200: { "message": "Session ended.", "actualDurationMinutes": 87 }
```

#### `PATCH /api/v1/teacher/sessions/:id/cancel`
No body.
```json
// Response 200: { "message": "Session cancelled." }
// Error 400: { "code": "INVALID_STATUS", "message": "Only scheduled sessions can be cancelled." }
```

#### `GET /api/v1/teacher/classes/:classId/notices`
```json
// Response 200: { "notices": [ { "id", "class_id", "title", "content", "type", "file_name", "created_at" } ] }
```

#### `POST /api/v1/teacher/notices`
```json
// Request
{ "classId": "uuid", "title": "Week 1 Study Guide", "content": "", "type": "pdf", "fileName": "week1.pdf" }
// Response 201: { "notice": { ...full notice row... } }
```

#### `DELETE /api/v1/teacher/notices/:id`
```json
// Response 200: { "message": "Notice deleted." }
// Error 403: notice doesn't belong to this teacher
```

---

### Editor

All editor endpoints mirror admin equivalents but use `/editor/` prefix and require editor token.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/editor/teachers` | List all teachers |
| PATCH | `/api/v1/editor/teachers/:id/approve` | Approve teacher |
| PATCH | `/api/v1/editor/teachers/:id/reject` | Reject teacher |
| GET | `/api/v1/editor/sessions` | All sessions across all classes |
| PATCH | `/api/v1/editor/sessions/:id` | Edit session (changeNote required) |
| PATCH | `/api/v1/editor/sessions/:id/cancel` | Cancel session |

---

### Student

#### `GET /api/v1/student/classes`
Requires student token.
```json
// Response 200
{
  "classes": [
    {
      "id": "uuid",
      "name": "Step 1 Intensive",
      "productName": "USMLE Online Sessions",
      "teacherName": "Dr. James Carter",
      "defaultDurationMinutes": 90,
      "nextSession": { "id": "uuid", "scheduledAt": "...", "status": "live", "meetingLink": "https://zoom.us/j/..." },
      "enrolledAt": "2026-04-01T00:00:00Z",
      "demoExpiresAt": null
    }
  ]
}
```

#### `GET /api/v1/student/classes/:classId`
Returns single class detail. 403 if not enrolled.

#### `GET /api/v1/student/classes/:classId/sessions`
`meetingLink` is `null` unless `status === 'live'` — meeting link is only revealed when the session is actually live.

#### `GET /api/v1/student/classes/:classId/notices`
403 if not enrolled.

---

### Public

#### `GET /api/v1/products`
No auth. Returns active products for the homepage.

---

## 8. Zoom API Integration

Meeting links are generated server-side when a session is created. The `generateZoomMeetingLink()` function in `backend/src/lib/zoom.ts` is a placeholder in the first half. When Zoom credentials are ready:

### Setup Steps (Zoom Marketplace)
1. Go to [marketplace.zoom.us](https://marketplace.zoom.us) → Build App → **Server-to-Server OAuth**
2. Note the **Account ID**, **Client ID**, **Client Secret**
3. Add these to `.env`:
   ```
   ZOOM_ACCOUNT_ID=your_account_id
   ZOOM_CLIENT_ID=your_client_id
   ZOOM_CLIENT_SECRET=your_client_secret
   ```
4. Grant scopes: `meeting:write:admin`

### Token Flow
The Server-to-Server OAuth grant does not require user interaction. The backend exchanges credentials for an access token on each API call (or caches it until it expires — 1 hour TTL):

```typescript
async function getZoomAccessToken(): Promise<string> {
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
    }
  )
  const { access_token } = await res.json()
  return access_token
}
```

### Meeting Creation
Called inside `POST /api/v1/teacher/sessions` when a session is created:

```typescript
async function generateZoomMeetingLink(topic: string, scheduledAt: string, durationMinutes: number): Promise<string> {
  const token = await getZoomAccessToken()
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      type: 2,                    // scheduled meeting
      start_time: scheduledAt,    // ISO 8601 format
      duration: durationMinutes,
      settings: {
        join_before_host: false,
        waiting_room: true,
        mute_upon_entry: true,
      },
    }),
  })
  const meeting = await res.json()
  return meeting.join_url          // store this in lms_sessions.meeting_link
}
```

> **Important:** The `join_url` is stored in `lms_sessions.meeting_link`. Students only receive it when `status === 'live'` (enforced in `GET /student/classes/:classId/sessions`).

---

## 9. Frontend ↔ Backend Connection Guide

The frontend is designed so that **only `src/services/lmsApi.ts` needs to change** when swapping from mock to real backend. Every page reads through this service. Nothing else needs to be touched.

### Step 1 — Update Auth Contexts

**`TeacherAuthContext.tsx`** — `login()` currently calls `loginTeacher()` from `lmsApi.ts`. Update the service function:

```typescript
// BEFORE (mock in lmsApi.ts):
export async function loginTeacher(email: string, password: string): Promise<Teacher> {
  const teachers = getTeachers()
  const match = teachers.find(t => t.email === email)
  const pwd = getTeacherPassword(match?.id ?? '')
  if (!match || pwd !== password) throw new Error('Invalid email or password.')
  return match
}

// AFTER (real):
export async function loginTeacher(email: string, password: string): Promise<{ teacher: Teacher; session: Session }> {
  const res = await fetch(`${API_BASE}/auth/teacher/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error.message)
  }
  return res.json()
}
```

Then update `TeacherAuthContext.tsx` to store `session.access_token` alongside the teacher object.

**`EditorAuthContext.tsx`** — same pattern, calls `/auth/editor/login`.

### Step 2 — Function-by-Function Swap Table

Every `// BACKEND SWAP` comment in `lmsApi.ts` maps to a real endpoint:

| Mock function | Real endpoint | Auth header |
|---|---|---|
| `registerTeacher(payload)` | `POST /auth/teacher/register` | none |
| `loginTeacher(email, pass)` | `POST /auth/teacher/login` | none |
| `loginEditor(email, pass)` | `POST /auth/editor/login` | none |
| `getTeacherClasses(teacherId)` | `GET /teacher/classes` | teacher token |
| `getTeacherSessions(classId)` | `GET /teacher/classes/:classId/sessions` | teacher token |
| `createSession(payload)` | `POST /teacher/sessions` | teacher token |
| `updateSession(id, payload)` | `PATCH /teacher/sessions/:id` | teacher token |
| `startSession(id)` | `POST /teacher/sessions/:id/start` | teacher token |
| `endSession(id)` | `POST /teacher/sessions/:id/end` | teacher token |
| `cancelSession(id)` | `PATCH /teacher/sessions/:id/cancel` | teacher token |
| `getNoticesForClass(classId)` | `GET /teacher/classes/:classId/notices` | teacher token |
| `createNotice(payload)` | `POST /teacher/notices` | teacher token |
| `deleteNotice(id)` | `DELETE /teacher/notices/:id` | teacher token |
| `adminGetTeachers()` | `GET /admin/teachers` | admin token |
| `adminApproveTeacher(id)` | `PATCH /admin/teachers/:id/approve` | admin token |
| `adminRejectTeacher(id)` | `PATCH /admin/teachers/:id/reject` | admin token |
| `adminReinstateTeacher(id)` | `PATCH /admin/teachers/:id/reinstate` | admin token |
| `adminCreateEditor(payload)` | `POST /admin/editors` | admin token |
| `adminGetProducts()` | `GET /admin/products` | admin token |
| `adminCreateProduct(payload)` | `POST /admin/products` | admin token |
| `adminUpdateProduct(id, p)` | `PATCH /admin/products/:id` | admin token |
| `adminDeleteProduct(id)` | `DELETE /admin/products/:id` | admin token |
| `adminGetAllSessions()` | `GET /admin/sessions` | admin token |
| `adminUpdateSession(id, p)` | `PATCH /admin/sessions/:id` | admin token |
| `adminCancelSession(id)` | `PATCH /admin/sessions/:id/cancel` | admin token |
| `adminGetDemoOverrides()` | `GET /admin/demo-overrides` | admin token |
| `adminSetDemoOverride(...)` | `PATCH /admin/students/:id/demo-override` | admin token |
| `studentGetEnrolledClasses(id)` | `GET /student/classes` | student token |
| `getClassById(classId)` | `GET /student/classes/:classId` | student token |
| `studentGetSessionsForClass(id)` | `GET /student/classes/:classId/sessions` | student token |
| `getNoticesForClass(classId)` | `GET /student/classes/:classId/notices` | student token |
| `getAllClassesWithProducts()` | `GET /admin/products` (includes classIds) | admin token |
| `getProducts()` (homepage) | `GET /products` | none |

### Step 3 — Token Passing Pattern

Each auth context already stores a `session` object. Pass it to every authenticated call:

```typescript
// In TeacherAuthContext.tsx:
const { teacher, session } = useTeacherAuth()

// Then in every lmsApi call:
getTeacherClasses(teacher.id, session!.accessToken)
```

Update function signatures in `lmsApi.ts` to accept `accessToken` as a parameter.

### Step 4 — Delete Mock Data Layer

Once backend is live and all functions are swapped:
1. Delete `frontend/src/data/lms.ts`
2. Remove all localStorage keys starting with `nextgen.lms.*`
3. Remove mock seed data imports from anywhere they were used

---

## 10. Frontend File Reference

| File | Purpose |
|---|---|
| `src/types/lms.ts` | All TypeScript interfaces — no changes needed on backend swap |
| `src/data/lms.ts` | **Delete after backend swap.** Mock localStorage data. |
| `src/services/lmsApi.ts` | **Only file to change on backend swap.** All `// BACKEND SWAP` comments. |
| `src/context/TeacherAuthContext.tsx` | Teacher auth state — store `session.access_token` after swap |
| `src/context/EditorAuthContext.tsx` | Editor auth state — same |
| `src/components/routing/TeacherProtectedRoute.tsx` | Redirects pending teachers to `/teacher/pending` |
| `src/components/routing/EditorProtectedRoute.tsx` | Redirects unauthenticated editors to `/editor/login` |
| `src/layouts/TeacherLayout.tsx` | Teacher sidebar |
| `src/layouts/EditorLayout.tsx` | Editor sidebar |
| `src/layouts/PublicLayout.tsx` | Public navbar/footer for About/Contact/FAQs |
| `src/pages/teacher/auth/TeacherRegisterPage.tsx` | Calls `registerTeacher()` |
| `src/pages/teacher/auth/TeacherLoginPage.tsx` | Calls `loginTeacher()` |
| `src/pages/teacher/auth/TeacherPendingPage.tsx` | Shown when `teacher.status === 'pending'` |
| `src/pages/teacher/TeacherDashboardPage.tsx` | Calls `getTeacherClasses()`, `getTeacherSessions()` |
| `src/pages/teacher/TeacherClassesPage.tsx` | Calls `getTeacherClasses()` |
| `src/pages/teacher/TeacherClassDetailPage.tsx` | Calls sessions, notices; has start/end/cancel actions |
| `src/pages/teacher/TeacherSessionFormPage.tsx` | Calls `createSession()` / `updateSession()` |
| `src/pages/editor/auth/EditorLoginPage.tsx` | Calls `loginEditor()` |
| `src/pages/editor/EditorDashboardPage.tsx` | Calls `adminGetTeachers()`, `adminGetAllSessions()` |
| `src/pages/editor/EditorSessionsPage.tsx` | Calls `adminGetAllSessions()`, update/cancel |
| `src/pages/editor/EditorSupervisionPage.tsx` | Shell — chat backend in second half |
| `src/pages/admin/AdminTeachersPage.tsx` | Teacher approval + editor creation |
| `src/pages/admin/AdminProductsPage.tsx` | Product CRUD |
| `src/pages/admin/AdminLmsSessionsPage.tsx` | All sessions management |
| `src/pages/admin/AdminStudentsPage.tsx` | Demo override column + modal |
| `src/pages/student/MyClassesPage.tsx` | Calls `studentGetEnrolledClasses()` |
| `src/pages/student/LiveSessionPage.tsx` | Calls `getClassById()`, `studentGetSessionsForClass()`, `getNoticesForClass()` |
| `src/pages/public/HomePage.tsx` | Calls `getProducts()` → maps to `GET /products` |
| `src/styles/teacher.css` | All teacher portal styles |
| `src/styles/editor.css` | All editor portal styles |
| `src/styles/lms-student.css` | Student LMS page styles |

---

## 11. Step-by-Step Implementation Order

Follow this exact sequence to avoid dependency issues.

```
Step 1   Run SQL migration 004_lms.sql in Supabase SQL Editor
Step 2   Update backend/src/config/env.ts — add 'teacher', 'editor' to ROLE_TYPES
Step 3   Create backend/src/lib/zoom.ts — generateZoomMeetingLink() placeholder
Step 4   Update backend/src/routes/auth.ts — add teacher register/login, editor login
Step 5   Create backend/src/routes/lmsPublic.ts — GET /products (no auth)
Step 6   Create backend/src/routes/lmsAdmin.ts — all admin endpoints
Step 7   Create backend/src/routes/lmsTeacher.ts — all teacher endpoints
Step 8   Create backend/src/routes/lmsEditor.ts — all editor endpoints
Step 9   Create backend/src/routes/lmsStudent.ts — all student endpoints
Step 10  Update backend/src/app.ts — mount all 5 new routers
Step 11  Test all endpoints with Postman/curl (see Section 12)
Step 12  Update frontend/src/services/lmsApi.ts — swap all mock functions with real fetch calls
Step 13  Update TeacherAuthContext.tsx — store access_token from login response
Step 14  Update EditorAuthContext.tsx — same
Step 15  Update all frontend pages — pass accessToken from context to service functions
Step 16  Delete frontend/src/data/lms.ts — no longer needed
Step 17  End-to-end test — full flows (see Section 12)
Step 18  (Optional) Wire up real Zoom API — replace placeholder in zoom.ts
```

---

## 12. Testing Checklist

### Auth
- [ ] Teacher registers → status is `pending`
- [ ] Pending teacher logs in → response has `status: 'pending'` → frontend redirects to `/teacher/pending`
- [ ] Approved teacher logs in → `status: 'approved'` → reaches dashboard
- [ ] Suspended teacher logs in → `403 ACCOUNT_SUSPENDED`
- [ ] Editor logs in with admin-created credentials
- [ ] Student JWT cannot access `/teacher/*` routes (403)
- [ ] Teacher JWT cannot access `/admin/*` routes (403)
- [ ] Editor JWT cannot access `/admin/*` routes (403)
- [ ] Unauthenticated request to any protected route returns 401

### Admin — Teachers
- [ ] `GET /admin/teachers` returns all teachers with class counts
- [ ] Approving a pending teacher allows them to log in and reach dashboard
- [ ] Rejecting sets status to `suspended`
- [ ] Reinstating a suspended teacher sets status back to `approved`

### Admin — Editors
- [ ] `POST /admin/editors` creates an editor who can log in at `/editor/login`
- [ ] Editor cannot register themselves (no public registration endpoint)

### Admin — Products
- [ ] Create product → appears in `GET /products` (public) if `isActive: true`
- [ ] Inactive product does NOT appear in public products list
- [ ] Delete product with active classes → returns 409
- [ ] Delete product with no classes → succeeds

### Admin — Sessions
- [ ] `GET /admin/sessions` returns sessions across all classes with teacher + product names
- [ ] Edit session with changeNote → `change_note` column updated
- [ ] Cancel a `scheduled` session → status becomes `cancelled`
- [ ] Cancel a `completed` session → no change (filtered by `.in('status', ['scheduled', 'live'])`)

### Admin — Demo Overrides
- [ ] Extend by 7 days → `demo_expires_at` set to now + 7 days; all student's enrollments updated
- [ ] Grant full access → `demo_expires_at` is null
- [ ] Reset → `demo_expires_at` set to now (immediately expired)

### Teacher
- [ ] `GET /teacher/classes` returns only classes assigned to the authenticated teacher
- [ ] Teacher cannot fetch sessions for another teacher's class (403)
- [ ] Create session → Zoom link auto-generated, stored in `lms_sessions.meeting_link`
- [ ] Edit session → `changeNote` is required — validation error if missing
- [ ] Start session → status flips to `live`, `started_at` set
- [ ] End session → status flips to `completed`, `actual_duration_minutes` computed
- [ ] Cancel session → only works on `scheduled` sessions
- [ ] Post notice → appears in class notice board
- [ ] Delete own notice → succeeds
- [ ] Delete another teacher's notice → 403

### Editor
- [ ] Editor can approve/reject teachers
- [ ] Editor can view all sessions (same as admin view)
- [ ] Editor can edit/cancel any session with changeNote

### Student
- [ ] `GET /student/classes` returns only enrolled classes
- [ ] Student accessing a class they are not enrolled in → 403
- [ ] Sessions list: `meetingLink` is `null` for `scheduled` sessions, populated for `live` sessions
- [ ] Demo access: student with expired `demo_expires_at` should be gated (second half — access control enforcement)

### Public
- [ ] `GET /products` returns only `is_active = true` products
- [ ] No auth token needed for `GET /products`

---

*Second half backend plan will be appended below this line after second half frontend is complete.*
