# Session Log

> Newest entries first. Each session appends at the top.

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
