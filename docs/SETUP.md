# Setup Guide

## Prerequisites

- .NET 10 SDK
- Node.js 20+ and npm
- Python 3.10+ (for ML pipelines)
- Azure CLI (for deployment)
- Git

## Local Development

### Backend (.NET 10)

The Azure SQL connection string is stored in `dotnet user-secrets` (NOT committed). Get the connection string from a teammate, then run once per machine:

```bash
cd backend/backend
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:MainAppDbConnection" "<azure sql conn string>"
```

Then to run the backend:

```bash
cd backend/backend
dotnet restore
dotnet run                 # starts on http://localhost:5176
```

CORS is configured to allow `http://localhost:5173` (vite dev) and the Vercel prod URL.

### Frontend (React/Vite)

```bash
cd frontend
cp .env.example .env.local  # set VITE_API_URL
npm install
npm run dev                 # starts on http://localhost:5173
```

### ML Pipelines

```bash
cd ml-pipelines
pip install -r requirements.txt
jupyter notebook
```

## Environment Variables

### Backend (`appsettings.Development.json` -- DO NOT COMMIT)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=<azure-sql-server>;Database=SafeHarbor;...",
    "IdentityConnection": "Server=<azure-sql-server>;Database=SafeHarborIdentity;..."
  },
  "Jwt": {
    "Key": "<generate-a-strong-key>",
    "Issuer": "SafeHarbor",
    "Audience": "SafeHarborApp"
  }
}
```

### Frontend (`.env.local` -- DO NOT COMMIT)

```
VITE_SUPABASE_URL=https://hfixzmwuqlrudcsslypz.supabase.co
VITE_SUPABASE_ANON_KEY=<get from Supabase dashboard → Settings → API>
VITE_API_URL=https://localhost:5001/api
```

## Azure Deployment

### Resources needed:
- Azure App Service (backend)
- Azure Static Web App or second App Service (frontend)
- Azure SQL Database (operational data)
- Azure SQL Database (identity data)
- Azure Key Vault (secrets -- optional but recommended)

### Deploy commands:

```bash
# Backend
cd backend
dotnet publish -c Release -o ./publish
az webapp deploy --resource-group SafeHarbor --name safe-harbor-api --src-path ./publish

# Frontend
cd frontend
npm run build
# Deploy dist/ folder to Azure Static Web Apps or App Service
```

## Database (Supabase / Postgres)

The operational database is hosted on Supabase. All 17 tables are already created
and seeded with the CSV data from `data/`.

- **Project ref:** `hfixzmwuqlrudcsslypz`
- **Project URL:** `https://hfixzmwuqlrudcsslypz.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/hfixzmwuqlrudcsslypz
- **Schema source of truth:** `docs/schema.sql`
- **Row counts:** ~8,093 rows across 17 tables (see `docs/SESSION-LOG.md`)

### How teammates connect

1. Get added to the Supabase org by Michael (request in Slack)
2. Open the project dashboard → **Settings → API** → copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
3. Create `frontend/.env.local` (see `frontend/.env.example`) and paste those two values
4. `cd frontend && npm install && npm run dev`
5. The DB password and personal access token are NOT needed for normal frontend dev — only for schema migrations or bulk loads

### Sensitive credentials (NOT in repo)

These live in 1Password / team Slack DM only:

| Name | Used by | Where to get |
|------|---------|--------------|
| `SUPABASE_DB_PASSWORD` | Direct DB connection, migrations | Slack DM from Michael |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI (`supabase link`) | https://supabase.com/dashboard/account/tokens |
| `SUPABASE_ANON_KEY` | Frontend client (public, but not in repo) | Project Settings → API |

### Re-running the schema

```bash
export SUPABASE_ACCESS_TOKEN=<your-pat>
npx supabase link --project-ref hfixzmwuqlrudcsslypz
npx supabase db query --linked -f docs/schema.sql
```

### Identity DB

Identity DB is separate from operational DB (per IS 414 spec). TBD — likely a
second Supabase project or a separate schema in this one.

## Grading Accounts

Create these accounts during setup:

| Account | Role | MFA | Purpose |
|---------|------|-----|---------|
| admin@safeharbor.org | Admin | OFF | Graders test CUD operations |
| donor@safeharbor.org | Donor | OFF | Graders test donor views |
| mfa-admin@safeharbor.org | Admin | ON | Proves MFA works (graders won't log in) |

## Useful Commands

```bash
# Check build
dotnet build                    # backend
npm run build                   # frontend

# Run tests
dotnet test                     # backend
npm run test                    # frontend (if configured)

# Lint
npm run lint                    # frontend

# EF Core migrations
dotnet ef migrations add <Name>
dotnet ef database update

# Lighthouse audit
npx lighthouse <url> --output html --output-path ./report.html
```
