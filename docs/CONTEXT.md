# Safe Harbor -- Project Context

## What is this?

INTEX W26 capstone project for IS 401 (PM), IS 413 (Dev), IS 414 (Security), IS 455 (ML). A full-stack web application for a nonprofit that operates safe homes for girls who are survivors of abuse and trafficking in the Philippines. Inspired by Lighthouse Sanctuary.

## Current Status

**Phase:** Tuesday Apr 7 (evening) — already past Wednesday's "one working page" target: 5 vertical slices wired end-to-end against live Azure SQL.
**Sprint:** Tuesday — Design + first working pages
**Deployed/Target:** Frontend on Vercel (auto-deploy on main). Backend runs locally against live Azure SQL `intexserverdatabase.database.windows.net / IntexDB`. Backend not yet deployed.

### What exists
- 5 vertical slices live end-to-end:
  1. **Home / Landing** (`/`) — `PublicImpactController` → `HomePage`
  2. **Impact / Donor Dashboard** (`/impact`) — `ImpactController` (`/summary`, `/outcomes`)
  3. **Admin Dashboard / Command Center** (`/admin`) — `AdminDashboardController` (kpis, safehouses, weekly-activity, recent-activity, upcoming-reviews)
  4. **Donors & Contributions** (`/donors`) — `SupportersController` + `DonationsController`
  5. **Process Recording** (`/process-recordings`) — `ResidentsController` + `ProcessRecordingsController`
- ASP.NET Core .NET 10 backend with EF Core models for all 17 tables (PR #7/#8) and per-resource controllers (slices 1-5)
- React + Vite frontend: `PublicHeader` (public routes) / `StaffHeader` (admin routes), per-slice typed hooks with mock fallback, warm cream/burgundy design tokens
- `frontend/src/lib/api.ts` — typed `apiGet<T>` helper that returns `{ data, error }` and never throws
- All admin KPIs anchor to the most recent date with real activity (handles historical seed data)
- ML pipelines: donor churn + resident wellbeing notebooks under `ml-pipelines/`
- 17-table schema applied to Azure SQL, seeded
- Plan doc: `plans/2026-04-07-five-vertical-slices.md`
- Backend Azure SQL conn string lives in `backend/backend/appsettings.Development.json` (gitignored, NOT committed). See `docs/SETUP.md`.

### What's needed next
- IS 414 security: ASP.NET Identity, password policy, `[Authorize(Roles="Admin")]` on CUD endpoints, RBAC, CSP header, HSTS
- GDPR cookie consent banner + privacy policy footer (linked from home)
- Forms: Donors create/edit, Process Recording New Entry submission (currently preview-only)
- Backend deployment to Azure App Service
- Wire ML pipeline outputs into the admin dashboard
- Wednesday IS 401 deliverables: 5 page screenshots desktop+mobile, user feedback session, burndown update

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Backend | .NET 10 / C# Web API |
| Database | Azure SQL Database |
| Auth | ASP.NET Identity |
| Hosting | Azure (App Service / Static Web Apps) |
| ML | Python / Jupyter notebooks |
| Version Control | GitHub |

### Frontend Design System

- Canonical style guide: `frontend/DESIGN_GUIDE.md`
- Token source: `frontend/src/index.css` and `frontend/src/styles/design-tokens.css`
- Frontend styling updates should use semantic tokens/classes and avoid hardcoded hex values in page/component code.

## Key Deadlines

- **Mon Apr 6 11:59 PM** -- IS 401 Monday deliverables (requirements)
- **Tue Apr 7 11:59 PM** -- IS 401 Tuesday deliverables (design)
- **Wed Apr 8 11:59 PM** -- IS 401 Wednesday deliverables (one working page)
- **Thu Apr 9 11:59 PM** -- IS 401 Thursday deliverables (iterate)
- **Fri Apr 10 10:00 AM** -- Final submission (URLs, videos, credentials)
- **Fri Apr 10 12:00 PM** -- Presentations begin
- **Fri Apr 10 11:59 PM** -- Peer evaluation due

## Team

| Role | Name |
|------|------|
| Scrum Master | Willard Richards |
| Product Owner | Ethan Grundvig |
| Member 3 | Brandon Woods |
| Member 4 | Michael Hammer |

## Key Links

- Case PDF: `docs/INTEX W26 Case.pdf`
- Data: https://drive.google.com/file/d/1Dl8AcS1ydbHKL6PU0gP6tbUPqhPsUeXZ/view
- FigJam board: TBD (make a copy and submit to IS 401 Learning Suite)
- Submission form: https://byu.az1.qualtrics.com/jfe/form/SV_bsjPxSQyEdIQRhA
- Peer eval: https://byu.az1.qualtrics.com/jfe/form/SV_7VXtQGm7rT4cvoa
- INTEX Slack: https://join.slack.com/t/intexw26/shared_invite/zt-3udumsa9x-P87AgyhpD_DDG64adcimmg
