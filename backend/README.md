# NextGen Backend (Express + Supabase)

This backend provides student/admin auth APIs and role-based authorization using Supabase Auth + Postgres profiles.

## Implemented in this starter

- Express TypeScript server
- Health endpoint: `GET /api/v1/health`
- Auth endpoints:
  - `POST /api/v1/auth/student/register`
  - `POST /api/v1/auth/student/login`
  - `POST /api/v1/auth/student/forgot-password`
  - `POST /api/v1/auth/student/reset-password`
  - `POST /api/v1/auth/admin/login`
- JWT verification middleware via Supabase JWKS
- Role authorization middleware (`student` / `admin`)
- Protected profile routes:
  - `GET /api/v1/me`
  - `GET /api/v1/student/me`
  - `GET /api/v1/admin/me`

## Environment

Copy `.env.example` to `.env` and fill values.

Required:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended for student password reset flow:
- `FRONTEND_URL` (default: `http://localhost:5173`)

For reset emails to work, add `${FRONTEND_URL}/student/reset-password` to Supabase Auth redirect URLs.

Admin accounts are **not** self-registered through backend endpoints.
To create admin access, create/authenticate the user in Supabase Auth and set `public.profiles.role = 'admin'` for that user directly in DB.

## SQL setup (Supabase)

For the current auth-only phase (student/admin login + register), run:
1. `sql/001_profiles_and_authz.sql`

`sql/002_billing_foundation.sql` is optional for now and can be added later when billing/subscriptions are implemented.

### Auth-only SQL runbook

1. Open Supabase Dashboard → SQL Editor.
2. Paste and run `sql/001_profiles_and_authz.sql`.
3. Verify required auth table/policies:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'profiles';

select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
order by policyname;
```

4. Create admin users only via Supabase Auth + DB role update (no admin register endpoint).

## Run

```bash
cd backend
npm install
npm run dev
```

Build check:

```bash
cd backend
npm run typecheck
npm run build
```

## Request examples

### Student register

```http
POST /api/v1/auth/student/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Passw0rd!123",
  "fullName": "Demo Student",
  "medicalSchool": "Aga Khan University"
}
```

### Admin provisioning (DB)

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

After login, use `session.access_token` as Bearer token for protected routes.
