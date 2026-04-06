# Setup Guide

## Prerequisites

- .NET 10 SDK
- Node.js 20+ and npm
- Python 3.10+ (for ML pipelines)
- Azure CLI (for deployment)
- Git

## Local Development

### Backend (.NET 10)

```bash
cd backend
cp appsettings.example.json appsettings.Development.json  # add your connection strings
dotnet restore
dotnet ef database update  # run migrations
dotnet run                 # starts on https://localhost:5001
```

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

## Database

- 17 tables from provided CSVs
- Place CSVs in `data/` directory
- Seed script: TBD (create EF Core seed or SQL import script)
- Identity DB is separate from operational DB

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
