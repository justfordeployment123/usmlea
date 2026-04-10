# Phase 2 — Reliability + Observability (Frontend)

This note captures the Phase 2 baseline implemented in the frontend codebase.

## Implemented

- Centralized frontend observability service in `frontend/src/services/observability.ts`
  - Structured `info/warn/error` logging
  - `captureException()` for normalized exception capture
  - Optional `sendBeacon` path for production telemetry forwarding

- Shared error utilities in `frontend/src/services/errorUtils.ts`
  - `normalizeError()` for unknown error safety
  - `safeParseJson()` to prevent runtime crashes from malformed persisted JSON

- Global runtime guards in `frontend/src/main.tsx`
  - `window.error` listener
  - `window.unhandledrejection` listener

- Hardened auth persistence paths
  - `frontend/src/context/StudentAuthContext.tsx`
  - `frontend/src/context/AdminAuthContext.tsx`
  - Added safe parsing, malformed-persistence cleanup, and exception capture

- Hardened critical student/admin flows
  - `frontend/src/pages/student/auth/StudentLoginPage.tsx`
    - Guarded async submit with user-safe fallback message
  - `frontend/src/pages/student/TestSessionPage.tsx`
    - Guarded end-of-test submission path with visible fallback banner
  - `frontend/src/pages/admin/AdminMetricsPage.tsx`
    - Guarded metrics derivation with fallback dataset rendering
  - `frontend/src/components/student/create-test/TimelineAdjuster.tsx`
    - Logged recalibration requests and guarded recalibration action

## Scope of this phase

- This phase establishes frontend reliability/observability foundations.
- It does not add backend APM integration or production alert routing yet.
