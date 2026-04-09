# Setup Guide

## Prerequisites

- .NET 10 SDK
- Node.js 20+ and npm
- Python 3.10+ (for ML pipelines)
- Azure CLI (for deployment)
- Git

## Local Development

### Backend (.NET 10)

Get the Azure SQL connection string from a teammate (Slack), then create `backend/backend/appsettings.Development.json` (gitignored, never commit):

```json
{
  "ConnectionStrings": {
    "MainAppDbConnection": "<paste conn string here>"
  }
}
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
cp .env.example .env.local  # set VITE_API_BASE_URL
npm install
npm run dev                 # starts on http://localhost:5173
```

### ML Pipelines

```bash
cd ml-pipelines
pip install -r requirements.txt
pip install -e ../ml_service
jupyter notebook
```

### ML inference API (FastAPI) + .NET bridge

1. Train donor churn (from repo root, requires `data/`):

   ```bash
   python scripts/train_donor_churn.py
   ```

2. Run FastAPI (repo root; uses `models/`):

   ```bash
   pip install -r ml_api/requirements.txt
   pip install -e ml_service
   # optional production-like mode:
   # export MODEL_SOURCE=blob
   # export AZURE_STORAGE_CONNECTION_STRING=...
   # export AZURE_BLOB_CONTAINER=ml-models
   # export AZURE_BLOB_PREFIX=models/latest
   python -m uvicorn ml_api.main:app --host 127.0.0.1 --port 8010
   ```

3. Backend: in `appsettings.Development.json` (gitignored) set:

   ```json
   "Ml": {
     "BaseUrl": "http://localhost:8010",
     "ApiKey": ""
   }
   ```

   Optional: set `ML_API_KEY` in the FastAPI environment and the same value in `Ml:ApiKey`.

Full matrix and endpoints: [`docs/ml-deployment.md`](ml-deployment.md).
Frontend page mapping for ML:
- `/donors`: donor churn + donor high-value
- `/caseload`: resident wellbeing + early warning + reintegration readiness
- `/social-media`: social engagement to donations

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
VITE_API_BASE_URL=https://localhost:5001/api
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

## Database (Azure SQL)

The operational database is Azure SQL Database. The schema source of truth is:

- `docs/schema.sql`

Notes:
- The schema uses explicit integer primary keys (no `IDENTITY`).
- `backend/backend/Models/MainAppDbContext.cs` and entity models in `backend/backend/Models/` should stay aligned with `docs/schema.sql`.

### How teammates connect

1. Get the Azure SQL server/database names and credentials from team secret storage.
2. Set backend connection strings in `appsettings.Development.json`:
   - `ConnectionStrings:DefaultConnection` (operational DB)
   - `ConnectionStrings:IdentityConnection` (identity DB)
3. Run backend locally:
   - `cd backend`
   - `dotnet restore`
   - `dotnet run`
4. Set `frontend/.env.local` with `VITE_API_BASE_URL` pointing to local backend API.

### Sensitive credentials (NOT in repo)

These belong in Azure App Service Configuration / Key Vault (or local secret storage for dev):

| Name | Used by |
|------|---------|
| `DefaultConnection` | Main operational Azure SQL connection string |
| `IdentityConnection` | Identity Azure SQL connection string |
| `Jwt:Key` | JWT signing key |

### Applying or re-applying schema

Use Azure SQL tooling (`sqlcmd`, Azure Data Studio, SSMS, or migration workflow) to execute:

- `docs/schema.sql`

Example with `sqlcmd`:

```bash
sqlcmd -S <server>.database.windows.net -d <database> -U <username> -P <password> -i docs/schema.sql
```

### Identity DB

Identity database is separate from operational data (per IS 414 spec), hosted on Azure SQL.

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
