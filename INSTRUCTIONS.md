# Safe Harbor -- INTEX W26

> This is the single source of truth for all AI tools on this project.
> Each tool (Claude Code, Cursor, Copilot, Windsurf, etc.) has a pointer file that tells it to read this file.
> **Edit THIS file** to change instructions -- never edit the pointer files.

## Project Overview

**Safe Harbor** is a nonprofit web application for an organization that operates safe homes for girls who are survivors of sexual abuse and sex trafficking in the Philippines. It manages three domains: donor/support, case management, and social media outreach.

- **Tech Stack:** .NET 10 / C# (backend), React / TypeScript with Vite (frontend), Azure SQL Database (primary DB), ASP.NET Identity (auth)
- **Deploy Target:** Microsoft Azure (App Service + Azure SQL)
- **Due:** Friday April 10, 2026 at 10:00 AM
- **Presentation:** Friday April 10 starting at 12:00 PM (20 min + 5 min Q&A)

## Team Roles

> Fill in names once assigned:
- **Scrum Master:** TBD
- **Product Owner:** TBD
- **Member 3:** TBD
- **Member 4:** TBD

## Session Protocol (READ THIS FIRST)

### Starting a session

1. Read `docs/CONTEXT.md` for current project state
2. Read the last 3-5 entries of `docs/SESSION-LOG.md`
3. Check `plans/` for any active plans relevant to your work
4. Summarize what you see and ask what to work on

### Ending a session

When the user says they're done:

1. Summarize what was accomplished
2. Prepend an entry to `docs/SESSION-LOG.md` (newest first) with:
   - Date, time, and who was working
   - What was done
   - Files changed
   - Decisions made
   - Next steps
3. Update `docs/CONTEXT.md` if project state changed
4. Log significant technical decisions to `docs/DECISIONS.md`
5. Stage only `docs/` files, commit with "docs: session log YYYY-MM-DD", push to main

## Git Workflow

### Branching

```
main                  -- always deployable, protected
  feature/<name>      -- new features (e.g., feature/donor-dashboard)
  fix/<name>          -- bug fixes
  chore/<name>        -- config, CI/CD, tooling
```

### Branch naming by domain

To avoid conflicts, each team member should generally work in their assigned domain:

| Domain | Branch prefix examples | Key directories |
|--------|----------------------|-----------------|
| Frontend - Public pages | `feature/landing-page`, `feature/impact-dashboard` | `frontend/src/pages/public/` |
| Frontend - Admin pages | `feature/admin-dashboard`, `feature/caseload` | `frontend/src/pages/admin/` |
| Backend - API | `feature/api-donors`, `feature/api-residents` | `backend/Controllers/`, `backend/Models/` |
| ML Pipelines | `feature/ml-donor-churn`, `feature/ml-reintegration` | `ml-pipelines/` |
| Security & Auth | `feature/auth-identity`, `feature/csp-headers` | `backend/`, `frontend/src/auth/` |
| Infrastructure | `chore/azure-deploy`, `chore/docker` | `.github/`, `infra/` |

### Commit messages

Use conventional commits:

```
feat: add donor contribution tracking page
fix: resolve CORS issue on donation endpoint
chore: configure Azure deployment pipeline
docs: session log 2026-04-07
style: fix responsive layout on caseload page
test: add unit tests for resident API
```

### Pull Requests

1. Create a PR from your feature branch to `main`
2. Title: short, descriptive (under 70 chars)
3. Body: what changed, why, how to test
4. At least one other team member reviews before merge
5. Squash merge to keep `main` history clean
6. Delete the branch after merge

### Conflict prevention

- **Never** work directly on `main` (except docs commits)
- Pull from `main` before starting new work: `git pull origin main`
- Rebase your branch on `main` before opening a PR: `git rebase main`
- If two people must touch the same file, communicate first
- Shared files (routes, App.tsx, DB context) -- coordinate changes in team chat

## Project Structure

```
safe-harbor/
  INSTRUCTIONS.md        -- AI instructions (all tools read this)
  CLAUDE.md              -- pointer for Claude Code
  .cursorrules           -- pointer for Cursor
  .github/copilot-instructions.md -- pointer for GitHub Copilot
  .windsurfrules         -- pointer for Windsurf
  .gitignore
  docs/
    CONTEXT.md           -- project state and status
    SESSION-LOG.md       -- append-only session history
    DECISIONS.md         -- technical decisions with rationale
    SETUP.md             -- env vars, connection strings, dev commands
    INTEX W26 Case.pdf   -- original case document
  plans/                 -- feature plans and sprint plans
  frontend/              -- React + TypeScript + Vite
    src/
      components/        -- shared/reusable components
      pages/
        public/          -- landing, impact dashboard, login, privacy
        admin/           -- admin dashboard, donors, caseload, etc.
      auth/              -- auth context, guards, login logic
      api/               -- API client functions
      types/             -- TypeScript interfaces matching backend models
  backend/               -- .NET 10 / C# Web API
    Controllers/         -- API controllers
    Models/              -- EF Core entity models
    Data/                -- DbContext, migrations
    Services/            -- business logic
    Auth/                -- Identity config, roles, policies
  ml-pipelines/          -- Jupyter notebooks (one per pipeline)
  infra/                 -- Dockerfiles, Azure config, CI/CD
  data/                  -- CSV seed data (17 tables)
```

## CI/CD Pipeline

### Local development

```bash
# Backend
cd backend
dotnet restore
dotnet run

# Frontend
cd frontend
npm install
npm run dev
```

### Deployment checklist

Before merging to `main`:
- [ ] `dotnet build` passes with no errors
- [ ] `npm run build` passes with no errors
- [ ] No credentials in committed code (check .env, appsettings)
- [ ] API endpoints have proper `[Authorize]` attributes
- [ ] New pages are responsive (desktop + mobile)
- [ ] Lighthouse accessibility score >= 90%

### Azure deployment

- Backend: Azure App Service (.NET 10)
- Frontend: Azure Static Web Apps or App Service
- Database: Azure SQL Database
- Identity DB: Azure SQL (separate database)
- Secrets: Azure Key Vault or App Service Configuration (never in code)

## Security Requirements (IS 414)

These are non-negotiable and must be demonstrated in the video:

- [ ] HTTPS with valid TLS certificate
- [ ] HTTP to HTTPS redirect
- [ ] ASP.NET Identity with username/password auth
- [ ] Stronger password policy (per class instruction, NOT Microsoft docs defaults)
- [ ] All CUD API endpoints require auth + admin role
- [ ] RBAC: Admin, Donor, unauthenticated visitor roles
- [ ] Delete confirmation on all destructive actions
- [ ] Credentials in .env / Azure config, NOT in code or repo
- [ ] GDPR privacy policy in footer
- [ ] Functional GDPR cookie consent banner
- [ ] Content-Security-Policy HTTP header (not meta tag)
- [ ] Site deployed and publicly accessible

### Additional security (pick several):
- [ ] Third-party OAuth (Google, Microsoft, etc.)
- [ ] 2FA/MFA (keep one admin + one donor account WITHOUT MFA for grading)
- [ ] HSTS header
- [ ] Browser-accessible cookie for user preference (dark mode, language)
- [ ] Input sanitization / output encoding
- [ ] Both DBs on real DBMS (not SQLite)
- [ ] Docker container deployment

## Required Pages

### Public (unauthenticated)
1. **Home / Landing Page** -- mission, CTAs, professional design
2. **Impact / Donor Dashboard** -- aggregated anonymized outcome data
3. **Login Page** -- username/password with validation
4. **Privacy Policy** -- GDPR-compliant, linked from footer
5. **Cookie Consent Banner** -- functional, not just cosmetic

### Admin (authenticated)
1. **Admin Dashboard** -- active residents, recent donations, upcoming conferences
2. **Donors & Contributions** -- CRUD supporter profiles, track all donation types
3. **Caseload Inventory** -- CRUD resident profiles, filtering, search
4. **Process Recording** -- counseling session notes, chronological history
5. **Home Visitation & Case Conferences** -- log visits, view conference history
6. **Reports & Analytics** -- donation trends, resident outcomes, safehouse comparisons

## ML Pipelines (IS 455)

Each pipeline needs a self-contained `.ipynb` in `ml-pipelines/` with these sections:
1. Problem Framing (predictive vs. explanatory, business justification)
2. Data Acquisition, Preparation & Exploration
3. Modeling & Feature Selection
4. Evaluation & Interpretation (in business terms)
5. Causal and Relationship Analysis
6. Deployment Notes (API endpoint or dashboard integration)

Pipeline ideas across the three domains:
- **Donor churn prediction** -- which donors are at risk of lapsing?
- **Donation amount prediction** -- which donors might give more if asked?
- **Social media effectiveness** -- what content drives donations vs. just likes?
- **Reintegration readiness** -- which residents are ready for reintegration?
- **Resident risk classification** -- which residents are struggling/at risk of regression?
- **Intervention effectiveness** -- which interventions correlate with better outcomes?

## Database

17 tables across 3 domains. See `docs/INTEX W26 Case.pdf` Appendix A for full data dictionary.

**Donor & Support:** safehouses, partners, partner_assignments, supporters, donations, in_kind_donation_items, donation_allocations

**Case Management:** residents, process_recordings, home_visitations, education_records, health_wellbeing_records, intervention_plans, incident_reports

**Outreach & Communication:** social_media_posts, safehouse_monthly_metrics, public_impact_snapshots

## Sprint Schedule

| Day | Focus | Key Deliverables |
|-----|-------|-----------------|
| Monday (Apr 6) | Requirements | Personas, journey map, MoSCoW, product backlog, sprint backlog, burndown chart, wireframes |
| Tuesday (Apr 7) | Design | AI-generated UI options (9 screenshots), design decision, tech stack diagram |
| Wednesday (Apr 8) | One working page | 5 page screenshots (desktop+mobile), one deployed page with DB, user feedback |
| Thursday (Apr 9) | Iterate | OKR metric, Lighthouse a11y >= 90%, responsive, retrospective |
| Friday (Apr 10) | Submit + Present | Video walkthroughs (IS413, IS414, IS455), URLs, credentials, presentation |

## Grading Accounts (create these)

1. Admin user WITHOUT MFA -- for grading CUD operations
2. Donor user WITHOUT MFA -- connected to historical donations
3. Any account WITH MFA -- to prove MFA works (graders won't log in)

## Code Style

- Backend: follow C# conventions (PascalCase for public members)
- Frontend: follow React/TS conventions (camelCase, PascalCase components)
- Use `async/await` consistently
- No `any` types in TypeScript -- define interfaces in `frontend/src/types/`
- API responses: use consistent JSON shape (`{ data, error, message }`)

## What NOT to do

- Don't commit secrets, .env files, or connection strings
- Don't work directly on `main` (except docs)
- Don't skip the session log -- future sessions depend on it
- Don't add features without checking the sprint backlog first
- Don't deploy without running the deployment checklist
- Don't forget to demonstrate features in the video -- undocumented work = zero points
