# Session Log

> Newest entries first. Each session appends at the top.

---

## 2026-04-09 -- Mobile-responsive nav, polish, logo, grouped header (Michael)

**What was done:**
- **PR #38 (merged)** -- mobile-responsive sweep
  - `AppHeader`: rewrote with desktop nav (≥`lg`) + burger menu below `lg`. Closes on route change, outside click, Escape.
  - `ImpactDashboard` + `HomePage`: dropped `min-h-[calc(100svh-72px)]` full-viewport sections that wasted space, replaced with natural `py-12/16/20`. Removed "Placeholder survivor stories" copy and meaningless Scroll/Stories chips.
  - All admin pages (Caseload, Donors, DonorDashboard, Reports, VisitationLogs, ProcessRecording, AdminDashboard, SocialMediaDashboard, MlIntegrationPage): added `overflow-x-hidden` to root, switched `px-6` to `px-4 sm:px-6`, reduced mobile vertical padding so wide tables can't break the page into horizontal body scroll. Tables themselves still scroll within their cards.
  - `MlIntegrationPage`: removed stale `StaffHeader` import causing double header.
  - Fix on top: safehouse cards on `/admin` had title overlapping ACTIVE badge -- changed to `flex-wrap` with `min-w-0 flex-1` on title, stats grid stacks 1-col on mobile.
- **PR #39 (merged)** -- lighthouse logo + favicon
  - New `LogoMark.tsx` line-art lighthouse component (dome, tower with diagonal stripes, lantern room + roof, wave) using `currentColor` so parent `text-primary` colors it
  - `AppHeader`: logo sits beside the wordmark
  - Standalone `public/safe-harbor-icon.svg` for favicon (hard-coded amber stroke)
  - `index.html`: favicon link + dropped "— Wireframes" from tab title
- **PR #40 (merged)** -- grouped nav + contact page + footer fixes
  - Collapsed 9-item admin nav to 6 top-level entries via 2 dropdowns: `Home / Impact / Dashboard / Case Management ▾ / Fundraising ▾ / Logout`
    - Case Management = Caseload, Process Recordings, Visitation Logs
    - Fundraising = Donor Contributions, Social Media, Reports
  - Desktop = click-to-open dropdown panel; mobile = accordion inside burger
  - New `/contact` page with email/phone/office/urgent-concerns/partner panels
  - HomePage "What we do" eyebrow renamed to "Our Mission", added `id="mission"` so `/#mission` works
  - Footer: Our Mission → `/#mission` (anchor), Contact → `/contact`, Privacy already correct
- **Audit (logged in as admin@admin.com at 375w)**: all 7 admin pages and public pages -- no horizontal page overflow anywhere, every table scrolls cleanly inside its card, dropdowns + accordion both verified

**Files changed:**
- `frontend/src/components/shared/AppHeader.tsx` (rewritten -- burger + grouped nav)
- `frontend/src/components/shared/LogoMark.tsx` (new)
- `frontend/src/components/shared/PublicFooter.tsx` (Contact + Mission links)
- `frontend/src/pages/ContactPage.tsx` (new)
- `frontend/src/pages/HomePage.tsx`, `ImpactDashboard.tsx`, `AdminDashboard.tsx`, `CaseloadInventory.tsx`, `DonorsContributions.tsx`, `DonorDashboard.tsx`, `ReportsAnalytics.tsx`, `ProcessRecording.tsx`, `VisitationLogs.tsx`, `SocialMediaDashboard.tsx`, `MlIntegrationPage.tsx`
- `frontend/index.html` (favicon, title)
- `frontend/public/safe-harbor-icon.svg` (new)
- `frontend/src/App.tsx` (`/contact` route)

**Decisions made:**
- 6-item nav cap with 2 dropdowns (Case Management, Fundraising) instead of mega-menu or shrinking text. Reasoning lives in the recommendation grid that PM signed off on.
- Use `<a href="/#mission">` (plain anchor) for footer Mission link instead of `Link` -- react-router v6 doesn't auto-scroll to hash, plain anchor is the cheapest reliable option.
- `LogoMark` uses `currentColor` so it can be reused anywhere without re-defining color; standalone favicon SVG hard-codes the amber since `<link rel="icon">` can't inherit.
- All admin pages got `overflow-x-hidden` on root as defense-in-depth -- even if a future widget overflows, the page won't horizontally scroll.

**Backend dev settings note (not committed):**
- Got `appsettings.Development.json` from teammate via Slack for local backend run. Contains both `MainAppDbConnection` and `AuthConnection`. File is gitignored and lives only in worktree.

**Next steps:**
- Azure SWA staging slot cap is full -- PR previews fail to deploy until old environments are cleaned up in the portal. Doesn't block submission since Vercel is the prod frontend.
- Remaining Thursday deliverables: Lighthouse a11y ≥ 90, 5 page screenshots desktop+mobile, retrospective, OKR metric, burndown.

---

## 2026-04-09 -- ML UX polish, social insights fallback, tooltip standardization (Brandon)

**What was done:**
- Resolved multiple UX and routing issues across ML surfaces:
  - Removed broken staff nav link `/social` and kept `/social-media`
  - Added/updated 9th-grade explanations for ML sections (donors/caseload/social)
  - Added consistent `?` explainer tooltips for key ML metrics
- Added sorting + pagination behavior:
  - Caseload ML tables: sorted and paginated in sets of 10
  - Donor churn: highest churn first, paginated by 10, with total-aware page display
- Added USD conversion hover tooltips for PHP values and standardized tooltip presentation
  - Introduced shared `InlineHoverTooltip`
  - Added shared `QuestionTooltip` and replaced duplicated inline tooltip implementations
- Implemented social-media fallback analytics when predictive output is empty:
  - New backend endpoint `GET /api/SocialMedia/insights-summary`
  - New frontend hook/types/panel to show actionable historical strategy insights
    (best platform, best content type, best posting time, recommended posting frequency)
- Fixed backend donor high-value default snapshot month logic:
  - `GetDonorHighValueScoresCore` now defaults `asOf` to latest donation month in DB (not current date)
- Added `PR_DESCRIPTION_TEMPLATE.md` and pre-filled it with this session’s summary/checklist/testing guidance.

**Files changed (high level):**
- Backend:
  - `backend/backend/Controllers/MlController.cs`
  - `backend/backend/Controllers/SocialMediaController.cs`
- Frontend:
  - `frontend/src/pages/{SocialMediaDashboard,DonorsContributions,AdminDashboard,ReportsAnalytics,ImpactDashboard,ProcessRecording}.tsx`
  - `frontend/src/components/ml/{MlDonorChurnPanel,MlResidentWellbeingPanel,MlEarlyWarningPanel,MlReintegrationReadinessPanel,MlSocialPipelinePanel,MlSocialEngagementForecastPanel}.tsx`
  - `frontend/src/components/social/SocialInsightsPanel.tsx` (new)
  - `frontend/src/components/shared/{InlineHoverTooltip,QuestionTooltip}.tsx` (`QuestionTooltip` new)
  - `frontend/src/hooks/useSocialInsightsSummary.ts` (new)
  - `frontend/src/types/socialInsights.ts` (new)
  - `frontend/src/lib/currencyPhp.ts`
- Docs/template:
  - `PR_DESCRIPTION_TEMPLATE.md`
  - `docs/SESSION-LOG.md`

**Verification:**
- `npm run build` passes
- Lint diagnostics on touched frontend files show no errors
- Local runtime verified for backend + frontend + ml_api
- Backend compile for changed code validated through `dotnet run`; standalone `dotnet build` can fail while app is running due file lock

**Deployment note:**
- Predictive `/api/Ml/*` endpoints in production still require a separately hosted FastAPI service and backend env var `Ml__BaseUrl` set to that service URL.
- Historical social insights endpoint runs fully on .NET + SQL and can work without external FastAPI.

---

## 2026-04-08 -- IS 455 ML deployment (shared ml_service, FastAPI, .NET proxy, UI)

**What was done:**
- Added `docs/ml-deployment.md` (architecture, endpoints, pipeline→page matrix, grader path, nightly retrain notes)
- Created `ml_service/` (donor churn feature engineering aligned with notebook) and `scripts/train_donor_churn.py`; training produces `models/donor_churn_rf.joblib` (gitignored)
- Added `ml_api/` FastAPI app: `/health`, `/models`, `POST /predict/donor-churn` (batch), placeholder routes for five other pipelines
- Backend: `MlController` with `GET /api/Ml/deployment-status`, `GET /api/Ml/donor-churn-scores`; `Program.cs` registers `HttpClient` `MlApi`; `appsettings.json` sample `Ml:BaseUrl`
- Frontend: `/admin/ml-integration`, `/social`, `MlDonorChurnPanel` on `/donors`, caseload + social ML status panels; StaffHeader nav links
- `ml-pipelines/requirements.txt`; SETUP.md ML section; Section 6 replaced in all six `.ipynb` with repo paths

**Files changed:** `ml_service/**`, `ml_api/**`, `scripts/train_donor_churn.py`, `models/README.md`, `backend/backend/Controllers/MlController.cs`, `backend/backend/Program.cs`, `backend/backend/appsettings.json`, `frontend/src/App.tsx`, `StaffHeader.tsx`, `DonorsContributions.tsx`, `CaseloadInventory.tsx`, new `components/ml/*`, `pages/MlIntegrationPage.tsx`, `SocialMediaDashboard.tsx`, hooks/types for ML, `docs/*`, `.gitignore`, six notebooks under `ml-pipelines/`

**Next steps:** Train remaining models and wire predict schemas; optional `pip install -e ml_service` in notebook first cell for shared imports; Azure deploy second App Service for Python

---

## 2026-04-08 -- Slice 3: Admin Dashboard wired to backend (Michael)

**What was done:**
- Built slice 3 from `plans/2026-04-07-five-vertical-slices.md` on branch `feature/slice-3-admin`
- New `AdminDashboardController` with 5 endpoints: `kpis`, `safehouses`, `weekly-activity`, `recent-activity`, `upcoming-reviews` — each wraps DB calls in try/catch returning 503 on failure
- New `useAdminDashboard.ts` hook file with typed hooks + mock fallbacks via a shared `useApiWithFallback` helper (fetches from API, falls back to local mock on any error)
- `AdminDashboard.tsx` swapped from `useMockData` to new hooks. Upcoming Reviews KPI no longer `—`, weekly bar chart has real bars scaled to max, recent activity feed renders items, new Upcoming Reviews card added to aside
- `dotnet build` passes; PR #10 opened against `main`

**Files changed:**
- `backend/backend/Controllers/AdminDashboardController.cs` (new)
- `frontend/src/hooks/useAdminDashboard.ts` (new)
- `frontend/src/pages/AdminDashboard.tsx` (modified)

**Decisions made:**
- Weekly activity combines `process_recordings + home_visitations + donations` counts per day (plan spec)
- Recent activity endpoint merges donations/recordings/visits and returns top 8 by timestamp
- Shared `useApiWithFallback` helper lives inside the hook file (slice-self-contained per plan)

**Next steps:**
- PR MCHammer-12/safe-harbor#10 awaiting review/merge
- Other slices (1, 2, 4, 5) in parallel on their own branches

---

## 2026-04-07 evening -- 5 vertical slices wired end-to-end to .NET + Azure SQL (Michael)

**What was done:**
- Wrote `plans/2026-04-07-five-vertical-slices.md` — full parallel-execution plan with file ownership matrix so 5 agents could work in parallel without conflicts
- **Phase 0 scaffolding** (commit `0bb80be`): CORS in `Program.cs`, typed `apiGet<T>` helper in `frontend/src/lib/api.ts`, new `PublicHeader` for public routes, expanded `StaffHeader` with Donors + Process Recording links, new `App.tsx` routes with placeholder pages, bumped TypeScript from invalid `~6.0.2` to `5.8.2` so `tsc` works with `erasableSyntaxOnly`
- **Phase 1 (5 parallel slice agents in separate windows)** — each landed its own feature branch:
  - Slice 1 / PR #12: Home / Landing — `PublicImpactController` + `usePublicImpact` + `HomePage`
  - Slice 2 / PR #11: Impact dashboard — `ImpactController` (`/summary`, `/outcomes`) + `useImpact` + page swap from mock to live
  - Slice 3 / PR #10: Admin command center — `AdminDashboardController` (5 endpoints) + `useAdminDashboard` + filled all 3 TODOs
  - Slice 4 / PR #9: Donors & Contributions — `SupportersController` + `DonationsController` + `useDonors` + new page (table, filters, KPIs, drawer detail)
  - Slice 5 / PR #13: Process Recording — `ResidentsController` + `ProcessRecordingsController` + `useProcessRecording` + new page (resident picker, session cards, preview-only New Entry modal)
- **Slice 3 contamination bug**: parallel agents were sharing one working tree, race-condition-checked out branches, and slice 3's branch ended up with slice 4's 4 files committed alongside its own. Caught it pre-merge by diffing each branch against main. Files were byte-identical to slice 4's, so `git rebase origin/main` after slice 4 merged dropped them automatically. Force-pushed clean slice 3.
- **PR #14 hotfix** after demo-testing the merged main:
  - Admin KPIs/charts were showing 0 because windows used "last 7 days from today" but seed data is historical (2025–2027 scattered). Added `GetAnchorDateAsync()` that finds max date across `process_recordings`, `home_visitations`, `donations` and anchors windows to that.
  - Recent Donations KPI: 30-day window ending at max donation date → $0 → **$4.8k**
  - Upcoming Reviews KPI: count of open/in-progress plans with scheduled conferences → 0 → **75**
  - Weekly Activity chart: switched from 7 daily bars (sparse, mostly 0) to **7 weekly buckets** → 3/7 visible bars → **6/7 visible**
  - Upcoming Reviews list: next 5 open conferences ≥ anchor, fall back to 5 most recent
  - HomePage: hero subhead was rendering `data.summary` which was stale `public_impact_snapshots.summary_text` reading "average health score 0, average education progress 0%". Replaced with hardcoded clean copy.
  - `docs/SETUP.md`: switched backend conn-string instructions from `dotnet user-secrets` to `appsettings.Development.json` per Ethan's preference (file is gitignored, conn string lives only on dev machines).

**Files changed:**
- `plans/2026-04-07-five-vertical-slices.md` (new)
- `backend/backend/Program.cs` (CORS, conditional HTTPS redirect)
- `backend/backend/Controllers/{PublicImpact,Impact,AdminDashboard,Supporters,Donations,Residents,ProcessRecordings}Controller.cs` (new)
- `frontend/src/lib/api.ts` (new)
- `frontend/src/components/shared/PublicHeader.tsx` (new), `StaffHeader.tsx` (updated nav)
- `frontend/src/App.tsx` (new routes)
- `frontend/src/pages/{HomePage,DonorsContributions,ProcessRecording}.tsx` (new)
- `frontend/src/pages/{ImpactDashboard,AdminDashboard}.tsx` (rewired to live hooks)
- `frontend/src/hooks/{usePublicImpact,useImpact,useAdminDashboard,useDonors,useProcessRecording}.ts` (new)
- `frontend/package.json` (typescript 5.8.2)
- `docs/SETUP.md` (appsettings.Development.json instructions)

**Decisions made:** see `docs/DECISIONS.md` entries from today (controller-per-resource, anchor-on-recent-activity, mock fallback in hooks, parallel-worktree lesson learned).

**Verification:**
- `dotnet build` and `npm run build` clean
- Live browser tested both `/admin` (KPIs and weekly chart show real numbers) and `/` (clean hero, no stale 0s) via preview MCP
- All 12 backend endpoints return 200 with real Azure SQL data

**Next steps:**
- Add `[Authorize]` attributes once IS 414 auth lands (ASP.NET Identity, password policy)
- Donors: wire create/edit forms (currently read-only)
- Process Recording: wire the New Entry modal save (currently preview-only)
- Cookie consent banner + privacy policy footer (IS 414 grading items)
- Wire ML pipeline outputs into the app (donor churn, resident wellbeing) once they're ready
- Tell Ethan + Brandon: parallel agents need separate `git worktree add` directories (one per slice), not one shared worktree — got bitten by it today, see DECISIONS.md

---

## 2026-04-07 12:23 -- pipeline/donor-churn branch: donor churn + resident wellbeing pipelines (Brandon)

**What was done:**
- Added a new `ml-pipelines/donor_churn_pipeline.ipynb` notebook for the donor churn workstream
- Added `ml-pipelines/resident_wellbeing_next_month.ipynb` and matching outline notes in `ml-pipelines/outlines/`
- Replaced the old `girls_wellbeing_predictive.ipynb` notebook with the new branch-specific pipeline notebooks
- Pushed the branch update to `origin/pipeline/donor-churn`

**Files changed:**
- `ml-pipelines/donor_churn_pipeline.ipynb`
- `ml-pipelines/girls_wellbeing_predictive.ipynb` (removed)
- `ml-pipelines/outlines/donor_churn_pipeline.md`
- `ml-pipelines/outlines/resident_wellbeing_next_month.md`
- `ml-pipelines/resident_wellbeing_next_month.ipynb`

**Decisions made:**
- Split the ML work into separate notebooks per outcome so donor churn and resident wellbeing can evolve independently
- Kept short outline markdown files beside the notebooks so the problem framing stays easy to review

**Next steps:**
- Review both notebooks end-to-end and tighten evaluation / interpretation notes where needed
- Open a PR from `pipeline/donor-churn` to `main` after the branch is ready

## 2026-04-07 -- Vercel deploy + full UI swap to Replit design (Michael)

**What was done:**
- **Vercel deployment**: imported repo on vercel.com, set Root Directory = `frontend`, added `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars. Auto-deploy on `main` is live.
- **Full frontend UI swap** to the Replit "elegant-interface-design" export (warm cream/burgundy theme, serif typography): new pages, shared header/footer/badge, wouter routing (replaced react-router-dom), `@/` path alias added to vite + tsconfig
- **New `useSupabaseData.ts` hooks** with all 3 pages wired to live data:
  - Impact: girls supported, active safehouses, donor count, reintegration outcome distribution
  - Admin: active residents, 7-day donation total, avg education progress, safehouse occupancy
  - Caseload: residents table with safehouse join and sub-category flag derivation
- Empty arrays / em-dashes mark TODOs that still need a data source (weekly bar chart, recent activity feed, upcoming reviews)
- Resolved merge conflicts with PRs #3/#4 (already merged to main) by deleting stale old-UI files and keeping the new UI
- Created `.claude/launch.json` for `preview_start`; frontend dev server runs on port 5173
- Created `vercel.json` (monorepo build config + SPA rewrites) — uncommitted, left for future use since dashboard settings are now working

**Files changed:**
- `frontend/src/App.tsx` (new, wouter)
- `frontend/src/main.tsx` (simplified)
- `frontend/src/index.css` (new warm theme design tokens)
- `frontend/src/pages/{ImpactDashboard,AdminDashboard,CaseloadInventory,not-found}.tsx` (new)
- `frontend/src/components/shared/{StaffHeader,PublicFooter,StatusBadge}.tsx` (new)
- `frontend/src/hooks/useSupabaseData.ts` (new — replaces useImpactData.ts)
- `frontend/src/lib/utils.ts` (new, cn helper)
- `frontend/src/data/featuredStory.ts` (new)
- `frontend/vite.config.ts` (@ alias)
- `frontend/tsconfig.json` (paths, relaxed noUnused*)
- `frontend/package.json` (added wouter, lucide-react, clsx, tailwind-merge, cva; dropped react-router-dom)
- Deleted: old layout/, wireframe/, router.tsx, ImpactDashboardPage.tsx, HomePage.tsx, useImpactData.ts, types/impact.ts, types/resident.ts, mockResidents.ts
- `.claude/launch.json` (new)
- `vercel.json` (new, uncommitted)

**Decisions made:**
- Skipped copying the Replit shadcn `components/ui/` directory (55 files) and all Radix deps since new pages don't use them — kept bundle small
- Dropped Tanstack Query and wrote a tiny `useAsync` helper in `useSupabaseData.ts` instead — saves the dep
- Dropped `tw-animate-css` and `@tailwindcss/typography` imports from index.css to avoid adding deps
- Used residents `internal_code` as both display name and ID (real names aren't in the schema — privacy by design)
- `ResidentStatus` type now lives in `hooks/useSupabaseData.ts`; `StatusBadge` imports from there

**PRs opened:**
- PR #5 — claude/stoic-sutherland (full UI swap) — MERGEABLE, ready to merge

**Next steps:**
- Merge PR #5, confirm Vercel preview/prod deploy renders correctly
- Wire remaining Admin TODOs (weekly activity, recent activity feed, upcoming reviews) once a data source is chosen
- Begin .NET backend scaffolding (auth + admin CRUD)
- Identity DB decision (separate Supabase schema vs separate project)
- Continue Tuesday design deliverables

---

## 2026-04-07 -- Supabase wiring + Impact Dashboard + Landing Page slices (Michael)

**What was done:**
- Connected Supabase project `hfixzmwuqlrudcsslypz`, applied schema, seeded ~8,093 rows across 17 tables from `data/*.csv`
- Added `@supabase/supabase-js` and `frontend/src/lib/supabase.ts` client
- Created 3 SECURITY DEFINER RPC functions granted to anon for safe aggregate access: `impact_summary`, `outcome_distribution`, `donations_monthly_trend`
- Built `useImpactData` hooks
- **Slice B - Impact Dashboard:** wired `ImpactDashboardPage` to live data, replaced mocked stat cards, added monthly donation trend chart, loading skeletons + error states
- **Slice A - Landing Page:** new `HomePage` at `/` with hero, live stats strip (30 girls / 9 safehouses / 59 donors), How We Help features, footer CTA
- Updated `docs/SETUP.md` with full Supabase access section + teammate onboarding steps
- Stored secrets in gitignored `.env.local`

**Files changed:**
- `frontend/src/lib/supabase.ts` (new)
- `frontend/src/types/impact.ts` (new)
- `frontend/src/hooks/useImpactData.ts` (new)
- `frontend/src/pages/ImpactDashboardPage.tsx` (live data)
- `frontend/src/pages/HomePage.tsx` (new)
- `frontend/src/router.tsx` (route `/` → HomePage)
- `frontend/.env.example` (new)
- `frontend/package.json`, `package-lock.json`
- `docs/SETUP.md` (Supabase section)
- `.gitignore`

**Decisions made:**
- Read-only frontend slices query Supabase directly via anon key + RPC functions; no .NET backend needed yet
- RPC functions are SECURITY DEFINER returning aggregates only (no PII) so anon-key access stays safe
- Landing page branch built on top of impact-dashboard branch (shared `useImpactSummary`); PR #4 must merge after PR #3
- Secrets in `.env.local` and team Slack/1Password, never committed
- Used Supabase CLI with PAT for bulk seeding after IPv6/pooler issues blocked direct psql

**PRs opened:**
- PR #3 — feature/impact-dashboard
- PR #4 — feature/landing-page (depends on #3)

**Next steps:**
- Merge PR #3, then PR #4
- Begin .NET backend scaffolding (auth + admin CRUD)
- Identity DB decision (separate Supabase project vs schema)
- Continue Tuesday design deliverables

---

## 2026-04-07 -- README GitHub formatting & wellbeing notebook coef notes (Brandon)

**What was done:**
- Reformatted `README.md` for GitHub-flavored Markdown (lists, fenced `git clone` block) without changing wording
- Tightened the linear-model coefficient readout in `ml-pipelines/girls_wellbeing_predictive.ipynb` (printed text + §5 bullet): scaled numerics = interpret as **per one SD**, `cat__` vs reference, not causal
- Added `.github/pull_request_template.COPY_PASTE_THEN_DELETE.md` as a disposable filled PR body for copy-paste (safe to delete after use)

**Files created/changed:**
- `README.md`
- `ml-pipelines/girls_wellbeing_predictive.ipynb`
- `docs/SESSION-LOG.md` (this entry)
- `.github/pull_request_template.COPY_PASTE_THEN_DELETE.md`

**Decisions made:**
- Keep coefficient explanation short (2–3 lines) next to the forest importances one-liner

**Next steps:**
- Open PR to `main`; remove `pull_request_template.COPY_PASTE_THEN_DELETE.md` from the branch if the team does not want it committed long term
- Continue sprint tasks per `plans/` and `docs/CONTEXT.md`

---

## 2026-04-06 -- Project Setup & Repo Creation (Michael)

**What was done:**
- Created project directory structure under `is-core/safe-harbor/`
- Read and digested full 34-page INTEX W26 case PDF
- Created `INSTRUCTIONS.md` as single source of truth for all AI tools
- Created pointer files for Claude Code, Cursor, Copilot, Windsurf
- Created `docs/` with CONTEXT.md, SESSION-LOG.md, DECISIONS.md, SETUP.md
- Created master sprint plan with day-by-day task assignments
- Created `.gitignore`, GitHub Actions CI pipeline, PR template
- Initialized git repo, pushed to github.com/MCHammer-12/safe-harbor

**Files created/changed:**
- `INSTRUCTIONS.md` -- main AI instructions
- `CLAUDE.md` -- pointer for Claude Code
- `.cursorrules` -- pointer for Cursor
- `.github/copilot-instructions.md` -- pointer for GitHub Copilot
- `.windsurfrules` -- pointer for Windsurf
- `.github/workflows/ci.yml` -- CI pipeline (build backend, frontend, secret scan)
- `.github/pull_request_template.md` -- PR checklist template
- `docs/CONTEXT.md`, `docs/SESSION-LOG.md`, `docs/DECISIONS.md`, `docs/SETUP.md`
- `plans/2026-04-06-intex-master-plan.md`
- `.gitignore`

**Decisions made:**
- Project name: Safe Harbor (pending team vote)
- Single `INSTRUCTIONS.md` with pointer files for multi-tool AI support
- Git workflow: feature branches, conventional commits, squash merge to main
- Domain-based branch prefixes to avoid merge conflicts
- GitHub Actions CI on every PR: .NET build, React build, secret scan

**Next steps:**
- Add team members as collaborators on GitHub
- Download the 17 CSV data files from Google Drive
- Start Monday deliverables (personas, journey map, MoSCoW, backlog, wireframes)
- Scaffold the .NET 10 backend and React/Vite frontend
