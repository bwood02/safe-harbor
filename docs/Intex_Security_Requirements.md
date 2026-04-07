# INTEX Security Context (IS413 + IS414)

## Project Overview

This is a full-stack enterprise web application built with:

- Backend: .NET 10 / C#
- Frontend: React + TypeScript (Vite)
- Database: Azure SQL / PostgreSQL / MySQL

The application supports:
- Public users (unauthenticated)
- Donors (authenticated)
- Admin/Staff users (authenticated with elevated permissions)

Security must be implemented as a **core architectural concern**, not as an afterthought.

---

# Core Security Principles

1. Least Privilege  
   Users only have access to what they need.

2. Secure by Default  
   All endpoints require authentication unless explicitly marked public.

3. Defense in Depth  
   Multiple layers: transport, authentication, authorization, headers.

4. Backend is Source of Truth  
   Never trust frontend validation or role enforcement.

5. Visibility for Grading  
   Every feature must be clearly demonstrable.

---

# SECURITY REQUIREMENTS

---

## 1. Confidentiality (Transport Security)

### Requirements
- All traffic must use HTTPS (TLS enabled)
- HTTP must redirect to HTTPS
- Valid SSL certificate must be present

### Implementation Notes
- Use cloud-provided certificate (Azure recommended)
- Enforce HTTPS in middleware

---

## 2. Authentication

### Requirements
- Username/password authentication required
- Use ASP.NET Identity (or equivalent)
- Passwords must be securely hashed

### Password Policy (STRICT – follow class rules)
- Minimum length: [SET BASED ON CLASS]
- Require uppercase letters
- Require lowercase letters
- Require numbers
- Require special characters

DO NOT use default Identity settings.

### Public Access
Unauthenticated users can access:
- Home page
- Privacy policy
- Public dashboard (if applicable)

---

## 3. Authorization (RBAC)

### Roles
- Admin
- Donor
- (Optional) Staff

### Rules
- Admin:
  - Full CRUD access
- Donor:
  - View own donation data
- Public:
  - Read-only access to limited data

### Enforcement
- Backend: Required (Authoritative)
- Frontend: UI only (non-secure)

---

## 4. API Security

### Public Endpoints
- /login
- /auth/me
- Public data endpoints

### Protected Endpoints
- ALL create/update/delete endpoints
- Most read endpoints with sensitive data

### Rule
If unsure → restrict access

---

## 5. Integrity

### Requirements
- Only authorized users can modify/delete data
- Deletion must require confirmation

### Implementation
- Backend authorization checks
- Frontend confirmation dialogs

---

## 6. Credential Security

### Requirements
- No secrets in source code or repository

### Acceptable Storage
- Environment variables
- .env files (excluded from Git)
- Cloud secret manager

### Sensitive Data
- DB connection strings
- JWT secrets
- API keys

---

## 7. Privacy

### Requirements
- GDPR-compliant privacy policy page
- Must be accessible from footer

### Cookie Consent
- Must display consent banner
- Must specify:
  - Cosmetic OR functional implementation

---

## 8. Attack Mitigation

### Required
- Content-Security-Policy (CSP) header

### Rules
- Only allow required sources:
  - default-src
  - script-src
  - style-src
  - img-src

### Important
- Must be HTTP header (NOT meta tag)

### Optional Enhancements
- Input sanitization
- Output encoding (React default protection)

---

## 9. Availability

### Requirements
- App must be publicly accessible

### Deployment Includes
- Backend deployed (Azure App Service recommended)
- Frontend deployed (Vercel / Azure Static Web Apps)
- Database deployed to real DBMS

---

## 10. Additional Security Features (Choose At Least One)

Options:
- Third-party authentication (Google, etc.)
- Two-factor authentication (2FA/MFA)
- HSTS (HTTP Strict Transport Security)
- User preference cookie (NOT HttpOnly)
- Input sanitization / XSS protection
- Docker deployment
- Separate identity database

### Requirement
Must clearly explain:
- What was implemented
- Why it was chosen

---

# ROLE DEFINITIONS

## Public User
- View landing page
- View impact dashboard
- View privacy policy
- Cannot modify data

## Donor
- Login required
- View donation history
- Submit donations (fake)

## Admin
- Full system access
- Manage:
  - Residents
  - Donations
  - Reports
  - Safehouses

---

# DATA ACCESS RULES

## Public Data
- Aggregated and anonymized only

## Protected Data
- Resident records
- User-specific donation data
- Internal reports

---

# CRITICAL IMPLEMENTATION RULES

## Backend Enforcement
- All auth + authorization enforced server-side

## Default Security
- All endpoints require auth unless explicitly opened

## No Trust in Frontend
- Frontend logic is NOT security

## AI Usage Rule
When using AI tools:
- Explicitly define:
  - Password rules
  - Roles
  - Authorization requirements

DO NOT accept:
- Default Identity configs
- Generic “secure” implementations

---

# TESTING CHECKLIST

## Authentication
- Valid login succeeds
- Invalid login fails
- Password rules enforced

## Authorization
- Admin-only endpoints blocked for others
- Donor cannot access admin data

## API Security
- Direct API calls require authentication

## Transport
- HTTP redirects to HTTPS

## Headers
- CSP header present in dev tools

## Privacy
- Privacy policy page exists
- Cookie banner displayed

---

# DEVELOPMENT PHASES

## Phase 1
- Identity setup
- Roles

## Phase 2
- Authentication

## Phase 3
- Authorization

## Phase 4
- API protection

## Phase 5
- Security features (CSP, cookies, etc.)

## Phase 6
- Deployment

---

# FINAL GOAL

A secure, production-style application where:
- All users are authenticated properly
- All data access is controlled via roles
- All communication is encrypted
- All security features are visible and testable
