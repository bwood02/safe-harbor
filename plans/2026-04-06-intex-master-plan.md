# Plan: INTEX W26 -- Safe Harbor

**Status:** Approved
**Created:** 2026-04-06

## Context

Build a full-stack nonprofit management platform for an organization modeled after Lighthouse Sanctuary. The system manages donors, case management for residents, and social media outreach. Graded across IS 401 (PM), IS 413 (Dev), IS 414 (Security), IS 455 (ML). 4-person team, 4 one-day sprints, presentation Friday.

## Team Work Allocation

### Recommended domain splits (4 people)

| Person | Primary Domain | Secondary |
|--------|---------------|-----------|
| **Person A** | Backend API + Database (models, controllers, EF Core, migrations, seeding) | Security (auth, RBAC, CSP) |
| **Person B** | Frontend -- Admin pages (dashboard, caseload, process recording, donors, reports) | Responsive design |
| **Person C** | Frontend -- Public pages (landing, impact dashboard, login, privacy, cookie consent) | UI/UX polish, accessibility |
| **Person D** | ML Pipelines + Data analysis | Integration of ML into web app (API endpoints, dashboard components) |

Everyone helps with deployment and video documentation on Thursday/Friday.

## Sprint Plan

### Monday (Apr 6) -- Requirements

**Sprint goal:** Understand the problem, plan the work, set up the codebase.

| Task | Owner | Points |
|------|-------|--------|
| Copy FigJam board, set up Slack channel | Scrum Master | 1 |
| Create 2 customer personas (Case Worker, Donor/Board Member) | All | 2 |
| Journey map for primary persona | All | 2 |
| Write problem statement | Product Owner | 1 |
| MoSCoW table (all requirements + 5 nice-to-haves) | All | 3 |
| Product backlog (12+ cards) | All | 3 |
| Sprint Monday backlog (8+ cards, assigned, estimated) | Scrum Master | 2 |
| Burndown chart setup | Scrum Master | 1 |
| Figma wireframes (3 most important screens) | Person C | 3 |
| `dotnet new webapi` scaffold + EF Core setup | Person A | 3 |
| `npm create vite` scaffold + routing setup | Person B/C | 2 |
| Download CSV data, explore schema | Person D | 2 |
| Database ERD and initial model design | Person A | 3 |

### Tuesday (Apr 7) -- Design

**Sprint goal:** Lock in the UI design and get frontend/backend wired together.

| Task | Owner | Points |
|------|-------|--------|
| Sprint Tuesday backlog screenshot | Scrum Master | 1 |
| Generate 3 UI design options via AI (9 screenshots) | Person C | 3 |
| 5 questions per design + feedback summary | Person C | 2 |
| Design decision writeup | All | 1 |
| Tech stack diagram | Any | 1 |
| EF Core models for all 17 tables | Person A | 5 |
| Database seeding from CSVs | Person A | 3 |
| ASP.NET Identity setup + login/register endpoints | Person A | 3 |
| React routing + layout components | Person B | 3 |
| Login page (frontend) | Person C | 2 |
| API client setup (axios/fetch wrapper) | Person B | 2 |
| Begin ML data exploration | Person D | 3 |

### Wednesday (Apr 8) -- One Working Page

**Sprint goal:** One page deployed end-to-end with database persistence.

| Task | Owner | Points |
|------|-------|--------|
| Sprint Wednesday backlog screenshot | Scrum Master | 1 |
| Deploy backend to Azure App Service | Person A | 3 |
| Deploy frontend to Azure | Person B/C | 3 |
| Deploy Azure SQL + run migrations | Person A | 2 |
| Landing page (polished) | Person C | 3 |
| Admin dashboard (with real data) | Person B | 5 |
| Donors & Contributions CRUD | Person B | 5 |
| Caseload Inventory page | Person B | 5 |
| Impact/donor-facing dashboard | Person C | 3 |
| Privacy policy page + cookie consent | Person C | 2 |
| HTTPS + HTTP redirect | Person A | 1 |
| CSP header configuration | Person A | 2 |
| Screenshots: 5 pages desktop + mobile | Any | 1 |
| User feedback session (5 changes) | Any | 1 |
| Burndown chart update | Scrum Master | 1 |
| First ML pipeline complete (notebook) | Person D | 5 |

### Thursday (Apr 9) -- Iterate

**Sprint goal:** Polish, accessibility, metrics, additional features, ML deployment.

| Task | Owner | Points |
|------|-------|--------|
| Sprint Thursday backlog screenshot | Scrum Master | 1 |
| Process Recording page | Person B | 3 |
| Home Visitation & Case Conferences page | Person B | 3 |
| Reports & Analytics page | Person B | 5 |
| OKR metric implementation | Person B | 2 |
| Lighthouse a11y >= 90% on all pages | Person C | 3 |
| Responsive audit (desktop + mobile) | Person C | 2 |
| RBAC enforcement (admin-only CUD) | Person A | 2 |
| Delete confirmation dialogs | Person A/B | 1 |
| Credential security audit (no secrets in repo) | Person A | 1 |
| Additional security features (OAuth, MFA, HSTS, dark mode cookie) | Person A | 5 |
| Second ML pipeline | Person D | 5 |
| ML model API endpoints | Person D + A | 3 |
| ML results on dashboard | Person D + B | 3 |
| Retrospective | All | 1 |

### Friday (Apr 10) -- Submit + Present

| Task | Owner | Time |
|------|-------|------|
| Final deployment verification | All | 8:00 AM |
| Record IS 413 video walkthrough | All | 8:30 AM |
| Record IS 414 video walkthrough | Person A | 9:00 AM |
| Record IS 455 video walkthrough | Person D | 9:15 AM |
| Submit: URLs, videos, credentials via Qualtrics | Any | 9:30 AM |
| Verify GitHub repo is public | Any | 9:45 AM |
| Presentation prep | All | 10:00 AM |
| **Submission deadline** | -- | **10:00 AM** |
| **Presentations begin** | -- | **12:00 PM** |
| Peer evaluation | Each person | After presentation |

## Points Breakdown

| Class | Component | Points |
|-------|-----------|--------|
| IS 401 | Monday requirements | 6.5 |
| IS 401 | Tuesday design | 4 |
| IS 401 | Wednesday working page | 4.5 |
| IS 401 | Thursday iterate | 5 |
| IS 413 | Web app (pages, functionality, code quality) | ~40 |
| IS 414 | Security (see rubric in case PDF) | 20 |
| IS 455 | ML pipelines | 20 |
| All | Presentation | 20% of overall |

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Azure deployment issues | High | Start deployment Wed morning, not Wed night |
| Merge conflicts | Medium | Domain-based branches, communicate before touching shared files |
| Password policy graded "per class instruction" | High | Follow EXACTLY what was taught in IS 414 lab, ignore AI/docs suggestions |
| Video doesn't show features | High | Use checklist, record in high resolution, verify playback before submit |
| ML notebooks not executable | Medium | Test top-to-bottom run before submission, use relative paths |

## Verification

- [ ] All required pages built and functional
- [ ] All security requirements met and demonstrated in video
- [ ] At least 2 ML pipelines complete with notebooks in `ml-pipelines/`
- [ ] ML models integrated into web app
- [ ] Site deployed and publicly accessible via HTTPS
- [ ] Lighthouse accessibility >= 90% on every page
- [ ] Every page responsive (desktop + mobile)
- [ ] Grading accounts created (admin no MFA, donor no MFA, any with MFA)
- [ ] GitHub repo set to public
- [ ] All videos recorded, uploaded publicly, and accessible
- [ ] Submission form completed with correct URLs
- [ ] Peer evaluation completed
