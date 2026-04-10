# Safe Harbor -- Project Context

## What is this?

INTEX W26 capstone project for IS 401 (PM), IS 413 (Dev), IS 414 (Security), IS 455 (ML). A full-stack web application for a nonprofit that operates safe homes for girls who are survivors of abuse and trafficking in the Philippines. Inspired by Lighthouse Sanctuary.

## Current Status

**Phase:** Thursday Apr 9 — iterate + polish day, T-1 from final submission.
**Sprint:** Thursday — IS 401 iterate deliverables.
**Deployed/Target:** Frontend + backend combined on Azure App Service `safe-harbor-app-cbhbghfvgzerf5f4.canadacentral-01.azurewebsites.net` (Free F1, .NET 10, Windows, Canada Central). React SPA served from wwwroot/. Both DBs on Azure SQL `intexserverdatabase.database.windows.net` (IntexDB + AuthDB). ML FastAPI service runs locally on :8010. Old Vercel/SWA frontends still exist but are superseded.

### What exists
- **Public pages:** `/` (Home with Our Mission section), `/impact`, `/contact`, `/privacy`, `/login`, `/register`, `/logout`
- **Admin pages (RBAC, ASP.NET Identity):** `/admin` (Command Center), `/caseload`, `/process-recordings`, `/visitation-logs`, `/donors`, `/social-media`, `/reports`, `/admin/ml-integration`
- **Donor pages:** `/donor` (My Dashboard)
- **Backend:** ASP.NET Core .NET 10, EF Core for all 17 tables, per-resource controllers, ASP.NET Identity with separate `AuthDB`, security headers (CSP/HSTS), `[Authorize]` on CUD endpoints
- **Auth:** Login/register/logout flows, AuthContext on frontend, role-protected routes via `RequireRole`. Test accounts: `admin@admin.com / iamalittleteapot` (Admin), `donor@donor.com / iamthebestdonor` (Donor)
- **Frontend design system:** warm cream/burgundy tokens, `AppHeader` with grouped nav (6 top-level items, 2 dropdowns: Case Management, Fundraising), burger menu + accordion on mobile, `LogoMark` lighthouse component. All pages mobile-responsive with `overflow-x-hidden` defense-in-depth.
- **ML pipelines:** donor churn, donor high-value, early warning, reintegration readiness, resident wellbeing, social engagement -- exposed via FastAPI `ml_api/main.py` and proxied through `MlController` in backend. Per-resource panels in `frontend/src/components/ml/`.
- **GDPR:** cookie consent banner active, privacy policy at `/privacy`, footer linked from every page
- **Pagination:** caseload, process recordings, visitation logs, audit log
- **Plan doc:** `plans/2026-04-07-five-vertical-slices.md`
- **Backend conn strings** in `backend/backend/appsettings.Development.json` (gitignored): `MainAppDbConnection` + `AuthConnection` -- get from Slack

### Key file pointers
- Header: `frontend/src/components/shared/AppHeader.tsx`
- Footer: `frontend/src/components/shared/PublicFooter.tsx`
- Logo: `frontend/src/components/shared/LogoMark.tsx`, favicon `frontend/public/safe-harbor-icon.svg`
- Auth client: `frontend/src/lib/AuthApi.ts`, context `frontend/src/context/AuthContext.tsx`
- API client: `frontend/src/lib/api.ts`
- Routes: `frontend/src/App.tsx`
- ML hooks: `frontend/src/hooks/useMl*.ts`
- Backend Identity: `backend/backend/Models/AuthIdentityDbContext.cs`, `Models/AuthIdentityGenerator.cs`, `Controllers/AuthController.cs`

### What's needed next
- Brandon must redeploy FastAPI with updated `ml_service/` for donor-high-value scores
- Fix CI/CD workflow (`main_safe-harbor.yml`) to target `safe-harbor-app` resource group `safe-harbor` (currently targets non-existent app)
- Google Safe Browsing false positive on OAuth redirect (new Azure subdomain, no reputation)
- Lighthouse a11y >= 90% audit
- Final submission Friday Apr 10 at 10am
- Presentations Friday Apr 10 at 12pm

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
