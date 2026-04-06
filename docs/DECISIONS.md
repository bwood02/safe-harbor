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
