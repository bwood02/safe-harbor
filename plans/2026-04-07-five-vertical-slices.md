# 2026-04-07 — Five Vertical Slices (Parallel Execution Plan)

## Goal

Deliver 5 vertical slices end-to-end (.NET controller + EF model already exists + frontend page + typed API client + mock-friendly fallback). The slices are:

1. **Home / Landing** (public)
2. **Impact / Donor Dashboard** (public, polish existing)
3. **Admin Dashboard / Command Center** (auth, fill TODOs)
4. **Donors & Contributions** (auth, new)
5. **Process Recording** (auth, new)

DB is **live** (Azure SQL, accessible via the ASP.NET backend per Ethan 2026-04-07). The connection string is in `dotnet user-secrets` locally, not committed. Each dev needs to set their own user secret before running the backend (see Phase 0 for the command). Frontend hits real endpoints; we keep a small mock-fallback in each hook only as a demo safety net for when the backend isn't running locally.

### Coordination point with Ethan (do this BEFORE Phase 0)

Ethan suggested putting all routes in `MainAppController.cs`. This plan instead creates one controller per page/domain (PublicImpact, Impact, AdminDashboard, Supporters, Donations, Residents, ProcessRecordings). Reasons:

- 5 parallel agents writing to one file = guaranteed merge conflicts
- REST convention: routes group by resource, not by UI page
- Easier to add `[Authorize]` per controller later when IS 414 work starts
- Easier code review

Recommended: confirm with Ethan in Slack ("we're going per-controller, here's why"), then proceed. If he insists on one file, this plan needs a rewrite — flag it before starting.

## Architecture decisions for this plan

- **Backend**: Each slice gets its own controller in `backend/backend/Controllers/`. EF models from PR #7/#8 are reused as-is. Read endpoints only for today (no CUD; auth comes later). Errors propagate naturally — DB is live so we don't need 503 fallback handling on the server.
- **CORS**: One change to `Program.cs` allows `http://localhost:5173` and the Vercel domain.
- **Frontend API client**: New `frontend/src/lib/api.ts` with a typed `apiGet<T>(path)` helper that points at `import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5176'` and on any failure (network, 4xx, 5xx) returns `{ data: null, error }`. Each page hook decides whether to show an error state or fall back to a local mock object exported alongside the hook (mock is just a demo safety net so pages render when the backend isn't running locally).
- **Hooks split**: One hook file per slice in `frontend/src/hooks/use{Slice}.ts`. The shared `useMockData.ts` stays for now but new pages should not add to it (avoids merge conflicts). Each `use{Slice}.ts` is self-contained: types + API call + mock fallback + the React hook.
- **Public vs Admin nav**: New `frontend/src/components/shared/PublicHeader.tsx` for `/` (Home) and `/impact`. Existing `StaffHeader.tsx` keeps `/admin`, `/caseload`, `/donors`, `/process-recordings`.
- **Routes** (`App.tsx`):
  - `/` → `HomePage` (was redirect to /impact)
  - `/impact` → existing
  - `/admin` → existing
  - `/caseload` → existing
  - `/donors` → new `DonorsContributions`
  - `/process-recordings` → new `ProcessRecording`

## Conflict-avoidance rules (READ THIS BEFORE STARTING ANY SLICE)

- Phase 0 must complete and be committed before any parallel slice agent starts.
- Each slice agent only edits files inside its assigned bullet list. No exceptions.
- Shared files (`App.tsx`, `Program.cs`, `StaffHeader.tsx`, `appsettings.json`, `useMockData.ts`) are **only** touched in Phase 0. Slice agents do not touch them.
- Each slice agent works in its **own git branch** named `feature/slice-{n}-{name}` based on the `feature/slice-scaffolding` branch from Phase 0.
- After each slice agent finishes, that branch is opened as a PR. Merge order doesn't matter because file sets are disjoint.

---

## Phase 0 — Scaffolding (1 agent, must finish first)

**Branch**: `feature/slice-scaffolding`

**Pre-flight (do once on each dev machine, NOT in this agent's branch)**:
```
cd backend/backend
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:MainAppDbConnection" "<azure sql conn string from Ethan>"
```

**Files this agent touches** (and only these):
- `backend/backend/Program.cs` — add CORS for `http://localhost:5173` and the Vercel prod URL, enable `app.UseCors()`. Comment out `UseHttpsRedirection` for dev or guard it on `!app.Environment.IsDevelopment()`.
- `docs/SETUP.md` — append a section explaining the user-secrets command above so the rest of the team can run the backend.
- `frontend/src/lib/api.ts` (new) — typed `apiGet<T>` helper.
- `frontend/src/components/shared/PublicHeader.tsx` (new) — Home / Impact / Login nav.
- `frontend/src/components/shared/StaffHeader.tsx` — add nav items for `Donors` and `Process Recording`.
- `frontend/src/App.tsx` — add new routes pointing at placeholder components (each slice agent will replace its own placeholder later).
- `frontend/src/pages/HomePage.tsx` (placeholder, slice 1 will replace)
- `frontend/src/pages/DonorsContributions.tsx` (placeholder, slice 4 will replace)
- `frontend/src/pages/ProcessRecording.tsx` (placeholder, slice 5 will replace)
- `frontend/.env.example` — add `VITE_API_BASE_URL=http://localhost:5099`

Placeholders should be the absolute minimum: a `StaffHeader`/`PublicHeader` + an `<h1>` saying "Coming soon". This unblocks routing so slice agents don't need to touch `App.tsx`.

**Done when**: `npm run build` passes in frontend; `dotnet build` passes in backend; PR opened.

---

## Phase 1 — Slices (5 agents, all parallel)

Every slice agent reads this plan first, then works only inside its file list.

### Slice 1 — Home / Landing (public)
**Branch**: `feature/slice-1-home`
**Owner agent**: Claude window 1

**Backend files**:
- `backend/backend/Controllers/PublicImpactController.cs` (new) — `GET /api/PublicImpact/snapshot` returns the latest `public_impact_snapshots` row + a small payload for the homepage hero (girls supported, safehouses count, donors count). Wraps DB call in try/catch returning 503 on unconfigured DB.

**Frontend files**:
- `frontend/src/pages/HomePage.tsx` — replace Phase 0 placeholder. Uses `PublicHeader`, hero with mission, 3 stat cards, 3 CTAs (Donate / Read Impact / Login), footer.
- `frontend/src/hooks/usePublicImpact.ts` (new) — `useHomepageStats()` calling `apiGet<HomepageStats>('/api/PublicImpact/snapshot')` with mock fallback `{ girlsSupported: 312, safehouses: 7, donors: 1284 }`.

**Definition of done**:
- `/` renders the new HomePage (no longer redirects to /impact)
- Page uses `bg-background` + serif headings per `DESIGN_GUIDE.md`
- Mock fallback works when backend isn't running
- Lighthouse a11y mental check (alt text, headings, aria)

---

### Slice 2 — Impact / Donor Dashboard (public, polish existing)
**Branch**: `feature/slice-2-impact`
**Owner agent**: Claude window 2

**Backend files**:
- `backend/backend/Controllers/ImpactController.cs` (new) — `GET /api/Impact/summary` (girls supported, active safehouses, donor count, monthly donation trend last 12 months) and `GET /api/Impact/outcomes` (reintegration outcome distribution).

**Frontend files**:
- `frontend/src/pages/ImpactDashboard.tsx` — swap from `useMockData` imports to new `useImpact.ts` hook. Add monthly donation trend bar chart (right after the stat cards section). Switch header from `StaffHeader` to `PublicHeader`.
- `frontend/src/hooks/useImpact.ts` (new) — `useImpactSummary()`, `useOutcomeDistribution()`, `useMonthlyDonationTrend()` with mock fallbacks (reuse current values from `useMockData.ts`).

**Definition of done**:
- Page uses `PublicHeader` not `StaffHeader`
- Calls real endpoints with mock fallback
- New monthly trend chart renders (bar or sparkline)
- Existing visual polish preserved

---

### Slice 3 — Admin Dashboard / Command Center
**Branch**: `feature/slice-3-admin`
**Owner agent**: Claude window 3

**Backend files**:
- `backend/backend/Controllers/AdminDashboardController.cs` (new) — endpoints:
  - `GET /api/AdminDashboard/kpis` → active residents, recent donations $ (last 7 days), upcoming case conferences count (intervention_plans where case_conference_date >= today, next 7 days), avg education progress
  - `GET /api/AdminDashboard/safehouses` → safehouse list with current_occupancy + capacity_girls
  - `GET /api/AdminDashboard/weekly-activity` → 7-day rollup of (process_recordings + home_visitations + donations) counts per day
  - `GET /api/AdminDashboard/recent-activity` → last 8 mixed events with title, meta, timestamp
  - `GET /api/AdminDashboard/upcoming-reviews` → next 5 case conferences

**Frontend files**:
- `frontend/src/pages/AdminDashboard.tsx` — replace `useMockData` calls with new `useAdminDashboard.ts`. Wire the 3 TODO sections (weekly bar chart, recent activity feed, upcoming reviews).
- `frontend/src/hooks/useAdminDashboard.ts` (new) — all 5 hooks with mock fallbacks (reuse + extend current `useAdminKpis` / `useSafehouses` mock data).

**Definition of done**:
- All 4 KPI cards show real values (or mock fallback)
- Weekly Activity bar chart actually has bars
- Recent Activity feed has real items
- Upcoming Reviews KPI is no longer `—`

---

### Slice 4 — Donors & Contributions (auth, new)
**Branch**: `feature/slice-4-donors`
**Owner agent**: Claude window 4

**Backend files**:
- `backend/backend/Controllers/SupportersController.cs` (new):
  - `GET /api/Supporters` (paged: `?page=1&pageSize=50&type=&status=&search=`) → list of supporters
  - `GET /api/Supporters/{id}` → single supporter detail
  - `GET /api/Supporters/{id}/donations` → all donations for that supporter
- `backend/backend/Controllers/DonationsController.cs` (new):
  - `GET /api/Donations/recent?days=30` → recent donations across all supporters
  - `GET /api/Donations/by-program-area` → totals grouped by `donation_allocations.program_area`

**Frontend files**:
- `frontend/src/pages/DonorsContributions.tsx` — replace placeholder. Layout:
  - Top: 4 KPI cards (total supporters, active monetary donors, last 30d $, top program area)
  - Filter bar (type, status, search)
  - Supporters table (sortable, paged)
  - Right drawer or expand row → supporter detail with their donations history
- `frontend/src/hooks/useDonors.ts` (new) — `useSupporters(filters)`, `useSupporterDetail(id)`, `useRecentDonations()`, `useDonationsByProgramArea()` with mock fallbacks (8 mock supporters, ~30 mock donations).

**Definition of done**:
- Table renders, filters change query string and re-fetch (or filter client-side if mock)
- Detail view shows supporter info + donations list
- Page uses `StaffHeader`

---

### Slice 5 — Process Recording (auth, new)
**Branch**: `feature/slice-5-process-recording`
**Owner agent**: Claude window 5

**Backend files**:
- `backend/backend/Controllers/ResidentsController.cs` (new) — `GET /api/Residents?status=Active&safehouseId=&search=` (used by the resident picker on this page; reusable later by Caseload page).
- `backend/backend/Controllers/ProcessRecordingsController.cs` (new):
  - `GET /api/ProcessRecordings?residentId={id}` → chronological session list for a resident
  - `GET /api/ProcessRecordings/{id}` → single session detail

**Frontend files**:
- `frontend/src/pages/ProcessRecording.tsx` — replace placeholder. Layout:
  - Left column: resident picker (search + list, sticky on desktop)
  - Right column: chronological list of process recordings for the selected resident
  - Each card shows session_date, social_worker, session_type chip, emotional_state_observed → emotional_state_end (with arrow), narrative excerpt, interventions tag list, follow_up actions, progress/concerns flags
  - "New Entry" button (opens modal — UI only today, no submit, just disabled "save" button with note)
- `frontend/src/hooks/useProcessRecording.ts` (new) — `useResidentsForPicker()`, `useProcessRecordings(residentId)`, with mock fallback (4 residents, ~12 sessions).

**Definition of done**:
- Picking a resident shows their sessions
- Empty state when no sessions
- Page uses `StaffHeader`
- New Entry modal opens but is non-submitting (clearly marked as preview)

---

## Phase 2 — Cleanup (1 agent, after all slices merged)

- Remove `frontend/src/hooks/useMockData.ts` if no page imports it anymore.
- Update `docs/CONTEXT.md` and prepend a `docs/SESSION-LOG.md` entry for the day.
- Update `docs/DECISIONS.md` with: "Per-slice hook files instead of central useMockData; api.ts uses mock fallback when backend unreachable; backend wired but unconfigured DB returns 503."

---

## File ownership matrix (use this to verify no overlaps)

| Phase | Slice | Files (exclusive) |
|---|---|---|
| 0 | scaffold | Program.cs, docs/SETUP.md, api.ts, PublicHeader.tsx, StaffHeader.tsx, App.tsx, HomePage.tsx (stub), DonorsContributions.tsx (stub), ProcessRecording.tsx (stub), .env.example |
| 1 | 1 home | PublicImpactController.cs, HomePage.tsx, usePublicImpact.ts |
| 1 | 2 impact | ImpactController.cs, ImpactDashboard.tsx, useImpact.ts |
| 1 | 3 admin | AdminDashboardController.cs, AdminDashboard.tsx, useAdminDashboard.ts |
| 1 | 4 donors | SupportersController.cs, DonationsController.cs, DonorsContributions.tsx, useDonors.ts |
| 1 | 5 process | ResidentsController.cs, ProcessRecordingsController.cs, ProcessRecording.tsx, useProcessRecording.ts |
| 2 | cleanup | useMockData.ts (delete if unused), CONTEXT.md, SESSION-LOG.md, DECISIONS.md |

---

## How to launch parallel agents

After Phase 0 is merged, open 5 terminal windows. In each, run Claude Code from this repo and start with one of:

```
work on slice 1 from plans/2026-04-07-five-vertical-slices.md
work on slice 2 from plans/2026-04-07-five-vertical-slices.md
work on slice 3 from plans/2026-04-07-five-vertical-slices.md
work on slice 4 from plans/2026-04-07-five-vertical-slices.md
work on slice 5 from plans/2026-04-07-five-vertical-slices.md
```

Each agent will read this doc, follow its file list strictly, and open a PR for its branch.
