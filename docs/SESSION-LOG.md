# Session Log

> Newest entries first. Each session appends at the top.

---

## 2026-04-07 -- README GitHub formatting & wellbeing notebook coef notes (Brandon)

**What was done:**
- Reformatted `README.md` for GitHub-flavored Markdown (lists, fenced `git clone` block) without changing wording
- Tightened the linear-model coefficient readout in `ml-pipelines/girls_wellbeing_predictive.ipynb` (printed text + §5 bullet): scaled numerics = interpret as **per one SD**, `cat__` vs reference, not causal
- Added `.github/pull_request_template.COPY_PASTE_THEN_DELETE.md` as a disposable filled PR body for copy-paste (safe to delete after use)

**Files created/changed:**
- `README.md`
- `ml-pipelines/girls_wellbeing_predictive.ipynb`
- `docs/SESSION-LOG.md` (this entry)
- `.github/pull_request_template.COPY_PASTE_THEN_DELETE.md`

**Decisions made:**
- Keep coefficient explanation short (2–3 lines) next to the forest importances one-liner

**Next steps:**
- Open PR to `main`; remove `pull_request_template.COPY_PASTE_THEN_DELETE.md` from the branch if the team does not want it committed long term
- Continue sprint tasks per `plans/` and `docs/CONTEXT.md`

---

## 2026-04-06 -- Project Setup & Repo Creation (Michael)

**What was done:**
- Created project directory structure under `is-core/safe-harbor/`
- Read and digested full 34-page INTEX W26 case PDF
- Created `INSTRUCTIONS.md` as single source of truth for all AI tools
- Created pointer files for Claude Code, Cursor, Copilot, Windsurf
- Created `docs/` with CONTEXT.md, SESSION-LOG.md, DECISIONS.md, SETUP.md
- Created master sprint plan with day-by-day task assignments
- Created `.gitignore`, GitHub Actions CI pipeline, PR template
- Initialized git repo, pushed to github.com/MCHammer-12/safe-harbor

**Files created/changed:**
- `INSTRUCTIONS.md` -- main AI instructions
- `CLAUDE.md` -- pointer for Claude Code
- `.cursorrules` -- pointer for Cursor
- `.github/copilot-instructions.md` -- pointer for GitHub Copilot
- `.windsurfrules` -- pointer for Windsurf
- `.github/workflows/ci.yml` -- CI pipeline (build backend, frontend, secret scan)
- `.github/pull_request_template.md` -- PR checklist template
- `docs/CONTEXT.md`, `docs/SESSION-LOG.md`, `docs/DECISIONS.md`, `docs/SETUP.md`
- `plans/2026-04-06-intex-master-plan.md`
- `.gitignore`

**Decisions made:**
- Project name: Safe Harbor (pending team vote)
- Single `INSTRUCTIONS.md` with pointer files for multi-tool AI support
- Git workflow: feature branches, conventional commits, squash merge to main
- Domain-based branch prefixes to avoid merge conflicts
- GitHub Actions CI on every PR: .NET build, React build, secret scan

**Next steps:**
- Add team members as collaborators on GitHub
- Download the 17 CSV data files from Google Drive
- Start Monday deliverables (personas, journey map, MoSCoW, backlog, wireframes)
- Scaffold the .NET 10 backend and React/Vite frontend
