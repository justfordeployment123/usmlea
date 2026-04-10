# Phase 3 — Final Polish + QA (Frontend)

This checklist is the frontend release-readiness record after Phase 1 (taxonomy alignment) and Phase 2 (reliability/observability).

## UI/UX Consistency

- [x] `Create Test` keeps test-scoping controls only (roadmap velocity moved to roadmap page).
- [x] `Roadmap` page hosts roadmap velocity/timeline recalibration widget.
- [x] `Test Review` back navigation points to `/student/create-test` for naming/route consistency.
- [x] Admin metrics helper copy no longer implies live refresh; now clearly marked as demo snapshot.
- [x] Timed-only session UX remains consistent (no in-test explanation reveal).

## Copy Cleanup

- [x] Replaced ambiguous wording where applicable (`Recalculating roadmap...`, consistent page labels).
- [x] Removed misleading operational hints from admin metrics UI.

## Reliability Regression Checks

- [x] Global exception and unhandled rejection capture remains wired in app bootstrap.
- [x] Auth persistence paths continue to safely parse and recover from malformed storage.
- [x] Guarded submission/derivation paths remain in Student Test Session and Admin Metrics.

## Build / Static Validation

- [ ] `npm run lint` (blocked by pre-existing issues in unrelated files)
- [x] `npm run build`

### Current lint blockers (pre-existing / unrelated to Phase 3 patch)

- `frontend/src/pages/admin/AdminCommentsPage.tsx` — `react-hooks/set-state-in-effect`
- `frontend/src/pages/admin/AdminStudentsPage.tsx` — `react-hooks/set-state-in-effect`
- `frontend/src/pages/student/ContentHubPage.tsx` — `react-hooks/purity`

## Known Non-Blocking Follow-ups

- Timer is still UI-level demo timing (full API-driven session timing is a backend integration phase).
- Observability endpoint `/api/frontend-observability` is placeholder-ready; production ingestion wiring is backend/ops dependent.
