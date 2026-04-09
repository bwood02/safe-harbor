# Plan: Michael's Page Completion Sprint (Caseload, Home Visitation, Reports & Analytics, Social Media)

**Status:** Draft
**Created:** 2026-04-08
**Deadline:** Friday April 10, 10:00 AM (video + submission due)

## Context

Michael's assignments on today's sprint backlog:
1. Caseload Inventory (case management page for admins) — vertical slice
2. Home Visitation & Case Conferences — vertical slice
3. Reports & Analytics — vertical slice
4. Social Media Dashboard — vertical slice, **after Brandon finishes his social-media ML pipeline**

Ethan is handling Process Recording separately (out of scope for this plan).

Ethan (PM) asked for per-page case-doc compliance and explicit field lists for what we show and what we accept as input. AI has been too loose about backend contracts — this plan pins them down before coding.

**Currently in good shape (no work in this plan):** Home, Impact Dashboard, Admin Dashboard, Donors & Contributions, Donor Dashboard.

**Out of this plan:** Process Recording (Ethan).

## Approach

Each slice is a self-contained vertical: controller → typed hook w/ fallback → page. One controller per resource, all new endpoints under `/api/<Resource>/...`. Async EF. No auth yet (IS 414 later).

Four slices are independent and CAN run in parallel in separate worktrees. The parallel-execution lesson from 2026-04-07 (see `docs/DECISIONS.md`): **one worktree per agent, no shared working directory**. A single Phase 0 scaffolding commit on `main` reserves every shared file (routes, nav links, controller stubs) BEFORE any slice agent starts, so slice agents NEVER touch shared files and cannot conflict.

Deliberately skipping: notes_restricted, multi-user approval, audit trails. Not required for MVP.

## Parallel Execution Strategy

### Phase 0 — Scaffolding (serial, one commit on main, ~15 min)

Pre-reserves every shared file so slice agents in Phase 1 never touch them. This is the ONLY phase that modifies `App.tsx`, `StaffHeader.tsx`, or creates new controller stubs. Runs in the current worktree directly on `main` (small enough, low risk).

**Shared files this phase edits (and nobody else will):**
- `frontend/src/App.tsx` — add all 4 routes pointing to placeholder pages
- `frontend/src/components/shared/StaffHeader.tsx` — add all 4 nav links
- `frontend/src/pages/CaseloadInventory.tsx` — leave existing stub intact (slice 1 rewrites)
- `frontend/src/pages/VisitationLogs.tsx` — write a placeholder "coming soon" page (slice 2 rewrites)
- `frontend/src/pages/ReportsAnalytics.tsx` — placeholder (slice 3 rewrites)
- `frontend/src/pages/SocialMediaDashboard.tsx` — placeholder (slice 4 rewrites)
- `backend/backend/Controllers/ReportsController.cs` — new empty controller with `[Route("api/[controller]")]` (slice 3 fills)

**Route reservations (final, no slice agent changes these):**
| Path | Page component |
|---|---|
| `/caseload` | `CaseloadInventoryPage` (already routed) |
| `/home-visits` | `VisitationLogsPage` (NEW route) |
| `/reports` | `ReportsAnalyticsPage` (NEW route) |
| `/social-media` | `SocialMediaDashboardPage` (NEW route) |

**Backend route prefixes (final, no collisions):**
| Slice | Prefix |
|---|---|
| Caseload | `/api/CaseloadInventory/*` |
| Home Visits | `/api/VisitationLogs/*` |
| Reports | `/api/Reports/*` |
| Social Media | `/api/SocialMedia/*` |

After Phase 0, commit + push to main: `chore: scaffold routes and placeholders for slice 1-4`. Pull to every other team member's working tree.

### Phase 1 — Parallel slice execution (4 agents, 4 worktrees)

Each agent runs in its own worktree and edits ONLY files from its ownership column. When an agent needs to check something about another slice, it reads — never edits — files outside its column.

**Create the worktrees before spawning agents:**
```bash
git worktree add -b feature/slice-caseload .claude/worktrees/slice-caseload main
git worktree add -b feature/slice-home-visits .claude/worktrees/slice-home-visits main
git worktree add -b feature/slice-reports .claude/worktrees/slice-reports main
git worktree add -b feature/slice-social-media .claude/worktrees/slice-social-media main
```

**File Ownership Matrix (CRITICAL — no file appears in two columns):**

| File | Slice 1 Caseload | Slice 2 HomeVisits | Slice 3 Reports | Slice 4 SocialMedia |
|---|---|---|---|---|
| `backend/.../CaseloadInventoryController.cs` | OWN | — | — | — |
| `backend/.../VisitationLogsController.cs` | — | OWN | — | — |
| `backend/.../ReportsController.cs` | — | — | OWN | — |
| `backend/.../SocialMediaController.cs` | — | — | — | OWN |
| `frontend/.../pages/CaseloadInventory.tsx` | OWN | — | — | — |
| `frontend/.../pages/VisitationLogs.tsx` | — | OWN | — | — |
| `frontend/.../pages/ReportsAnalytics.tsx` | — | — | OWN | — |
| `frontend/.../pages/SocialMediaDashboard.tsx` | — | — | — | OWN |
| `frontend/.../hooks/useCaseload.ts` | OWN (new) | — | — | — |
| `frontend/.../hooks/useVisitationLogs.ts` | — | OWN (new) | — | — |
| `frontend/.../hooks/useReports.ts` | — | — | OWN (new) | — |
| `frontend/.../hooks/useSocialMedia.ts` | — | — | — | OWN (new) |
| `frontend/.../types/caseload.ts` | OWN (new) | — | — | — |
| `frontend/.../types/visitationLogs.ts` | — | OWN (new) | — | — |
| `frontend/.../types/reports.ts` | — | — | OWN (new) | — |
| `frontend/.../types/socialMedia.ts` | — | — | — | OWN (new) |
| `frontend/.../App.tsx` | — | — | — | — (locked, Phase 0) |
| `frontend/.../components/shared/StaffHeader.tsx` | — | — | — | — (locked, Phase 0) |
| `backend/.../Program.cs` | — | — | — | — (locked) |
| `backend/.../MainAppDbContext.cs` | — | — | — | — (locked) |
| `backend/.../Models/*.cs` | — | — | — | — (locked, already correct) |

**Slice agent prompt template** (launch one per slice):
```
You are working in {worktree_path} on branch {branch}.
Read plans/2026-04-08-page-completion-sprint.md and follow ONLY section {N}.
OWNERSHIP: you may edit ONLY the files in your column of the File Ownership Matrix.
If you need to edit a file outside your column, STOP and report to the user.
Do NOT touch App.tsx, StaffHeader.tsx, Program.cs, or MainAppDbContext.cs.
When done: run `dotnet build` (backend) and `npm run build` (frontend) — both must pass.
Then follow the QA Checklist for your slice and report results.
Commit to {branch}, push, open PR to main, do NOT merge.
```

### Phase 2 — Integration + QA (serial, main worktree)

After all 4 slice PRs are ready:
1. Rebase each PR on latest main (should be clean since Phase 0 reserved everything)
2. Merge PRs one at a time
3. After each merge, run the full QA checklist (below) against the merged branch
4. If any slice fails QA, revert that PR and fix in its worktree

## Testing & QA

### Per-slice automated checks (run by the slice agent before PR)

1. `cd backend && dotnet build` — must exit 0, zero warnings on new files
2. `cd frontend && npm run build` — must exit 0
3. Backend smoke test (curl): hit every new endpoint with dev server running, confirm 200 + non-empty JSON where data exists. Example for caseload:
   ```
   curl -s http://localhost:5xxx/api/CaseloadInventory/residents | jq '.data | length'
   ```

### Per-slice manual checks (run by the slice agent in a headless browser via preview MCP)

For **Caseload**:
- [ ] List page loads at `/caseload`, shows ≥1 resident from real DB
- [ ] Each filter (status, safehouse, category, risk) narrows the list
- [ ] Search box filters by case control number
- [ ] Detail drawer opens, shows all field sections, all values match DB
- [ ] "New Resident" form validates required fields, submits successfully, new row appears
- [ ] Edit form loads prefilled, saves, changes persist on reload
- [ ] Delete confirmation → soft delete (case_status flips to Closed)

For **Home Visits**:
- [ ] Route `/home-visits` loads
- [ ] Resident picker lists all active residents
- [ ] Selecting a resident shows their visit history chronologically
- [ ] "New Visit" form submits, new visit appears in list
- [ ] Edit/delete flows work
- [ ] Case conference history section pulls from intervention_plans

For **Reports**:
- [ ] Route `/reports` loads
- [ ] All 7 data sections render without errors (even if some are empty)
- [ ] Date range picker re-queries all endpoints
- [ ] Charts render (no broken placeholders)
- [ ] Annual Accomplishment Report card populates with year data
- [ ] Safehouse comparison table is sortable

For **Social Media** (after Brandon):
- [ ] Route `/social-media` loads
- [ ] Posts table loads
- [ ] Brandon's ML insight card displays his output

### QA Checklist — final integration (run after all 4 merged to main)

Run in the main worktree on the `main` branch, against the deployed Vercel/Azure frontend + local backend.

**Build & startup:**
- [ ] `cd backend && dotnet build` clean
- [ ] `cd backend && dotnet run` starts without errors, confirms DB connection
- [ ] `cd frontend && npm run build` clean
- [ ] `cd frontend && npm run dev` starts, no console errors on load

**Route navigation:**
- [ ] Every nav link in StaffHeader navigates to the correct page
- [ ] Direct URL access to `/caseload`, `/home-visits`, `/reports`, `/social-media` works
- [ ] Back/forward browser navigation works on all pages
- [ ] No console errors on page load for any route

**Cross-page integrity:**
- [ ] Adding a resident in Caseload → appears in Home Visits resident picker
- [ ] Admin Dashboard KPIs still load (regression check)
- [ ] Donors page still loads (regression check)
- [ ] Impact dashboard still loads (regression check)
- [ ] Home page still loads (regression check)

**Responsive:**
- [ ] Each new page renders cleanly at 375px, 768px, 1440px widths
- [ ] No horizontal scroll at 375px
- [ ] Tables are either scrollable or stack at mobile widths

**Data integrity:**
- [ ] All new endpoints return `{ data, error, message }` shape
- [ ] No endpoint returns 500 on valid input
- [ ] Empty states render gracefully ("No residents match your filters")
- [ ] Loading states render during fetches
- [ ] Error states render if backend is down

**Deployment smoke test (after push to main):**
- [ ] Vercel auto-deploy succeeds
- [ ] Live site at https://safeharbor.mhammerventures.com/ loads all new pages
- [ ] Lighthouse accessibility score ≥ 90 on each new page (record screenshots)

### Bug triage

If QA finds a bug:
1. Reproduce it and note which slice owns the file
2. Open an issue in that slice's branch/worktree
3. Fix-forward (new commit on same branch) — do not rewrite merged history
4. Re-run the failing QA item

### Rollback path

Each slice has its own PR. If a slice is broken beyond quick-fix, revert that one PR on main without affecting the others. Because Phase 0 reserved routes independently, reverting slice 2 leaves slice 1/3/4 routes intact (the nav link will still exist but will land on the placeholder page).

## Sections

### 1. Caseload Inventory — **PRIMARY FOCUS**

**Case doc requirement (verbatim):** Staff can view, create, and update resident profiles including demographics, case category and sub-categories, disability info, family socio-demographic profile, admission details, referral info, assigned social workers, and reintegration tracking. Support filtering and searching by case status, safehouse, case category, and other key fields.

#### 1a. Backend — `CaseloadInventoryController.cs`

All endpoints under `/api/CaseloadInventory/...`. Returns `{ data, error, message }` shape.

| Method | Route | Purpose |
|---|---|---|
| GET | `residents` | List residents. Query params: `search` (name/case#/internal code), `status` (Active/Closed/Transferred), `safehouseId`, `category` (Abandoned/Foundling/Surrendered/Neglected), `riskLevel`. Returns **list view fields** only (see below). |
| GET | `residents/{id}` | Full detail view. Returns **every field on Resident** plus safehouse name + counts: processRecordingCount, homeVisitCount, openInterventionPlansCount, incidentCount. |
| POST | `residents` | Create. Body = **input field list** below. Returns the created resident. |
| PUT | `residents/{id}` | Update. Same body. |
| DELETE | `residents/{id}` | Soft delete by setting `case_status = "Closed"` and `date_closed = today`. Hard-delete disallowed. |
| GET | `safehouses` | For the filter dropdown. `{ safehouse_id, name, safehouse_code }`. |
| GET | `filters` | Returns distinct values for status, category, risk level, social workers (for dropdown pickers). |

**List view fields (table row):**
- `residentId`, `caseControlNo`, `internalCode`
- `safehouseName` (joined), `caseStatus`, `caseCategory`
- `presentAge`, `dateOfAdmission`, `lengthOfStay`
- `assignedSocialWorker`, `currentRiskLevel`
- `reintegrationStatus`

**Detail view fields** (all fields from `Resident` model) organized into sections:
- **Identity:** caseControlNo, internalCode, sex, dateOfBirth, birthStatus, placeOfBirth, religion, presentAge
- **Case:** caseStatus, caseCategory, all 10 sub_cat_* booleans, currentRiskLevel, initialRiskLevel
- **Disability / Special Needs:** isPwd, pwdType, hasSpecialNeeds, specialNeedsDiagnosis
- **Family:** familyIs4ps, familySoloParent, familyIndigenous, familyParentPwd, familyInformalSettler
- **Admission:** safehouseId → safehouseName, dateOfAdmission, ageUponAdmission, lengthOfStay
- **Referral:** referralSource, referringAgencyPerson, dateColbRegistered, dateColbObtained
- **Case Management:** assignedSocialWorker, initialCaseAssessment, dateCaseStudyPrepared
- **Reintegration:** reintegrationType, reintegrationStatus, dateClosed
- **Related counts:** process recordings, home visits, open intervention plans, incidents

**Create/Edit form inputs** (what a user types when adding a resident):
- Required: caseControlNo, internalCode, safehouseId, sex (default F), dateOfBirth, placeOfBirth, caseCategory, dateOfAdmission, referralSource, assignedSocialWorker, initialCaseAssessment, currentRiskLevel, initialRiskLevel, caseStatus (default Active)
- Optional: birthStatus, religion, all 10 sub_cat_* booleans (checkboxes, default false), isPwd + pwdType, hasSpecialNeeds + specialNeedsDiagnosis, 5 family_* booleans, ageUponAdmission, lengthOfStay, presentAge, referringAgencyPerson, dateColbRegistered, dateColbObtained, dateCaseStudyPrepared, reintegrationType, reintegrationStatus

Server computes: `dateEnrolled = dateOfAdmission`, `createdAt = now`. Server does NOT recompute age strings (frontend sends them; case doc says values may be inaccurate — acceptable for MVP).

#### 1b. Frontend — `useCaseload.ts` + rewritten `CaseloadInventory.tsx`

- New hook file `useCaseload.ts` with `useCaseloadList(filters)`, `useCaseloadDetail(id)`, `useCaseloadMutations()` (create/update/softDelete)
- Types in `frontend/src/types/caseload.ts`
- Page layout:
  - **Filter bar (wired)**: search input, status dropdown, safehouse dropdown, category dropdown, risk level dropdown — all drive the list query
  - **Table** with the list-view columns above, "View" action opens the detail drawer
  - **Detail drawer** (slide-in, not modal) rendering all field sections with an Edit button
  - **New Resident button** → form modal with the Create input list
  - **Edit form** → same form prefilled, submits PUT
  - **Delete**: confirmation dialog → soft delete (case_status=Closed)
- Use existing design tokens; no hardcoded colors

### 2. Home Visitation & Case Conferences — build from scratch

- Add route `/home-visits` in App.tsx, add nav link in `StaffHeader`
- Backend `VisitationLogsController.cs` (currently 11-line stub):
  - GET `/visits` with filters: residentId, visitType, fromDate, toDate
  - GET `/visits/{id}`
  - POST `/visits` — body: residentId, visitDate, socialWorker, visitType (enum), locationVisited, familyMembersPresent, purpose, observations, familyCooperationLevel, safetyConcernsNoted, followUpNeeded, followUpNotes, visitOutcome
  - PUT `/visits/{id}`
  - DELETE `/visits/{id}` (hard delete OK for MVP)
- Frontend page: resident picker → chronological visit list for that resident → "New Visit" modal → detail view
- Case conference history: pull from `intervention_plans` where `case_conference_date` is set, group by resident. Read-only for now (no create).

### 3. Reports & Analytics — vertical slice

**Case doc requirement (verbatim):** "Displays aggregated insights and trends to support decision-making. This should include donation trends over time, resident outcome metrics (education progress, health improvements), safehouse performance comparisons, and reintegration success rates. Consider structuring reports to align with the Annual Accomplishment Report format used by Philippine social welfare agencies, which tracks services provided (caring, healing, teaching), beneficiary counts, and program outcomes."

#### 3a. Backend — `ReportsController.cs` (new)

All endpoints under `/api/Reports/...`. Returns `{ data, error, message }`. All queries respect an optional `fromDate`/`toDate` filter; defaults anchor to the most recent activity date across relevant tables (reuse the `GetAnchorDateAsync` pattern from AdminDashboardController).

| Method | Route | Purpose |
|---|---|---|
| GET | `donation-trends` | Monthly donation totals (count + PHP amount) grouped by month for the trailing 12 months. Query: `groupBy` = month\|quarter. |
| GET | `donations-by-campaign` | Campaign comparison: sum PHP + donor count per `campaign_name`. |
| GET | `donations-by-type` | Monetary / InKind / Time / Skills / SocialMedia breakdown. |
| GET | `resident-outcomes` | Education progress averages + health score averages over time (monthly). Source: `education_records`, `health_wellbeing_records`. |
| GET | `safehouse-comparison` | Per-safehouse: active residents, avg education progress, avg health score, incident count, process recording count, home visit count. Source: `safehouse_monthly_metrics` + live joins. |
| GET | `reintegration-outcomes` | Count residents by `reintegration_status` (Not Started, In Progress, Completed, On Hold) and by `reintegration_type` (Family Reunification, Foster Care, Adoption Domestic, Adoption Inter-Country, Independent Living). |
| GET | `annual-accomplishment` | Structured per the Philippine AAR format: services provided (Caring, Healing, Teaching) counts from `intervention_plans.services_provided`, beneficiary counts (active residents), program outcomes (reintegration completions, education completions, health improvements). Query: `year`. |

**Fields returned (shown on page):**
- Donation trends: `{ period, donationCount, totalPhp }[]`
- Donations by campaign: `{ campaignName, totalPhp, donorCount }[]`
- Donations by type: `{ donationType, totalPhp, count }[]`
- Resident outcomes: `{ period, avgEducationProgress, avgHealthScore, activeResidentCount }[]`
- Safehouse comparison: `{ safehouseId, safehouseName, activeResidents, avgEducationProgress, avgHealthScore, incidentCount, processRecordingCount, homeVisitCount }[]`
- Reintegration: `{ statusBreakdown: {status,count}[], typeBreakdown: {type,count}[], completionRatePercent }`
- Annual accomplishment: `{ year, servicesProvided: {caring,healing,teaching}, beneficiaries: {totalServed, activeAtYearEnd}, outcomes: {reintegrationsCompleted, educationCompletions, avgHealthImprovement} }`

**No inputs** (read-only reports page). Future ML overlays from Brandon's donor churn / reintegration readiness / early warning pipelines can be added as additional endpoints; out of scope for initial slice.

#### 3b. Frontend — `useReports.ts` + rewritten `ReportsAnalytics.tsx`

- New hook file `useReports.ts` with one hook per endpoint, all using `useApiWithFallback`
- Types in `frontend/src/types/reports.ts`
- Page layout (sections, top to bottom):
  1. **Date range picker** (fromDate / toDate, defaults to anchor-date window)
  2. **Donation Trends** — line chart of monthly PHP total
  3. **Campaign Comparison** — horizontal bar chart
  4. **Donation Types** — donut / stacked bar
  5. **Resident Outcomes** — dual-line chart (education progress + health score over time)
  6. **Safehouse Comparison** — sortable table with per-safehouse metrics
  7. **Reintegration Success** — status donut + type breakdown
  8. **Annual Accomplishment Report** — formatted card mimicking the Philippine AAR structure (Caring / Healing / Teaching blocks + beneficiary + outcomes)
- Route `/reports` in App.tsx, add "Reports" nav link to StaffHeader
- Use design tokens, no hardcoded colors

### 4. Social Media Dashboard — coordinate w/ Brandon

**Case doc requirement:** Case doc doesn't list Social Media as its own required page — it's called out in the Misc section as "Any additional pages required to support functionality described in other portions of the project (e.g., security, social media, accessibility, or partner features)." The social media ML pipeline (Brandon's) is what makes this page valuable.

- **Before coding:** DM Brandon in Slack, ask what his social-media → donations pipeline outputs (endpoint? static JSON? notebook export?) and what fields he wants shown
- Page structure (tentative, pending Brandon's answer):
  - Posts table (platform, post_type, content_topic, engagement_rate, donation_referrals, estimated_donation_value_php)
  - KPI strip (total posts last 30d, total reach, total donations attributed, top-performing platform)
  - ML insight card from Brandon's pipeline (TBD)
- Backend `SocialMediaController.cs`: GET `/posts` with filters (platform, dateRange, postType); additional endpoints per Brandon's pipeline output
- Route `/social-media` in App.tsx, add nav link to StaffHeader
- **Do not start until Brandon responds.**

## Alternatives Considered

- **Full Resident edit with age recomputation**: rejected, case doc explicitly notes age strings may be inaccurate. Extra complexity, no reward.
- **Hard-delete residents**: rejected, violates integrity requirement in IS 414 spec. Soft-delete matches "data can only be removed carefully" language in the case.
- **Inline edit in table**: rejected, the Resident model has 40+ fields. Drawer/form is standard.
- **Combine Home Visits + Process Recording into one page**: rejected, case doc lists them as separate required pages.

## Verification

See the full "Testing & QA" section above. At sprint close:
- [ ] Phase 0 scaffolding merged to main
- [ ] All 4 slice PRs passed per-slice automated + manual checks
- [ ] Integration QA checklist 100% green
- [ ] Deployed to https://safeharbor.mhammerventures.com/
- [ ] Session log + CONTEXT.md updated with what shipped and what was deferred
