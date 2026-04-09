# Technical Decisions

> Log significant choices here with context so future sessions understand why.

---

## 2026-04-06 -- CLAUDE.md as team coordination layer

**Decision:** Use `CLAUDE.md` in the project root as the single source of truth for AI-assisted collaboration. All team members using Claude Code will have these instructions automatically loaded.

**Why:** 4-person team needs consistent AI behavior across sessions. CLAUDE.md is auto-read by Claude Code at conversation start -- no manual setup needed per teammate. Session logging ensures continuity between sessions by different people.

**Alternatives considered:**
- Shared prompt template (requires manual copy-paste each time)
- Custom CLI scripts (over-engineering for a 5-day project)
- `.cursorrules` or similar (locks to one IDE)

---

## 2026-04-06 -- Git workflow: feature branches + squash merge

**Decision:** Feature branches off `main`, domain-based prefixes, squash merge PRs.

**Why:** 4 developers working in parallel for 5 days. Feature branches prevent stepping on each other. Domain-based prefixes make ownership clear. Squash merge keeps main history clean and easy to debug if something breaks during the sprint.

---

## 2026-04-06 -- Tech stack: .NET 10 + React/Vite + Azure SQL

**Decision:** Per INTEX requirements -- no choice here. .NET 10 / C# backend, React / TypeScript (Vite) frontend, Azure SQL for relational DB.

**Why:** Required by IS 413 specification. Azure recommended due to student credits and class practice.

---

## 2026-04-07 -- One controller per resource, not one big MainAppController

**Decision:** Each domain gets its own ASP.NET controller in `backend/backend/Controllers/`: `PublicImpact`, `Impact`, `AdminDashboard`, `Supporters`, `Donations`, `Residents`, `ProcessRecordings`. NOT a single `MainAppController` with every route.

**Why:**
- Standard REST convention (group routes by resource, not by UI page)
- Lets multiple agents/devs work in parallel without merge conflicts on a single file
- Easier to apply `[Authorize(Roles="Admin")]` per controller when IS 414 auth lands
- Smaller files are easier to code-review

**Alternatives considered:** One `MainAppController` (Ethan's initial suggestion). Rejected for the parallelism + auth reasons above.

---

## 2026-04-07 -- Frontend hooks: typed apiGet + per-slice mock fallback

**Decision:** `frontend/src/lib/api.ts` exports a single `apiGet<T>(path)` helper that returns `{ data, error }` and never throws. Each page has its own hook file (`use{Slice}.ts`) that calls `apiGet` and falls back to a local mock object when the call fails. There is no central `useMockData.ts` for new pages — each slice owns its own.

**Why:**
- Pages always render (even if backend or DB is down) — important for the demo
- Per-slice hook files = zero merge conflicts when 5 agents work in parallel
- Mock fallback lives next to the real types so the shape stays in sync

---

## 2026-04-07 -- Admin dashboard windows anchor on most-recent activity, not wall-clock today

**Decision:** `AdminDashboardController.GetAnchorDateAsync()` finds the max of `process_recordings.session_date`, `home_visitations.visit_date`, and `donations.donation_date`, and uses that as the anchor for "recent" windows. The Weekly Activity chart displays 7 weekly buckets (not 7 daily bars).

**Why:** Seed data is historical (2025-2027 scattered) and clusters around specific months. "Last 7 days from today" produced all-zero KPIs and a near-empty bar chart. Anchoring to the most recent date with real activity makes the dashboard look alive without faking data. Weekly buckets amortize the day-level sparseness.

**Trade-off:** When real-time data starts flowing this is still correct because `today` is in the candidate set, so the anchor will move forward naturally.

---

## 2026-04-09 -- Admin dashboard metrics source-of-truth split by domain

**Decision:** Keep `AdminDashboardController` metric sources explicit by metric type:
- Occupancy and active-resident KPI: `residents` where `case_status == "Active"`
- Education/health KPIs + per-safehouse averages: latest per-resident record from `education_records` / `health_wellbeing_records` for active residents
- Incident KPI + per-safehouse incident indicator/count: latest row per safehouse from `safehouse_monthly_metrics`, constrained to `month_start <= today`

**Why:**
- `safehouse_monthly_metrics` had sparse/future-dated records and did not reliably represent current per-resident education/health state
- Education/health are better represented by resident-level latest snapshots
- Incident counting for the dashboard is a monthly operational metric and already modeled in monthly metrics table

---

## 2026-04-09 -- Frontend API usage standard: shared typed client + slice hooks

**Decision:** Frontend network calls should go through `frontend/src/lib/api.ts` (`apiGet`, `apiPost`, `apiPut`) with typed generics and per-slice hooks handling fallback/error strategy.

**Why:**
- Keeps fetch behavior consistent (same base URL, error normalization, JSON parsing rules)
- Reduces duplicated networking code in page components
- Keeps API contracts close to each feature slice (`useAdminDashboard.ts`, etc.)

---

## 2026-04-07 -- Parallel slice agents must use separate git worktrees

**Lesson learned, not yet enforced in tooling:** When 5 Claude Code windows ran the slice agents in parallel, they all shared one working directory. Concurrent `git checkout` calls raced and slice 3's branch ended up with slice 4's files committed to it. Recovered by rebasing slice 3 onto main after slice 4 merged (files were byte-identical so the rebase dropped them automatically), but the close call wasted ~20 min and almost lost work.

**Going forward:** Each parallel agent should run inside its own `git worktree add .claude/worktrees/<slice-name>` directory, not in the shared repo root. The plan doc template and `INSTRUCTIONS.md` have been updated with this rule.
