# Session Log

> Newest entries first. Each session appends at the top.

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
