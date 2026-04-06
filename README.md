Safe Harbor -- Getting Started

Clone the repo:

git clone https://github.com/MCHammer-12/safe-harbor.git
cd safe-harbor

Read INSTRUCTIONS.md -- this is the single source of truth for the project: git workflow, branching conventions, sprint plan, requirements, everything.

AI setup: Whatever AI coding tool you use, it will automatically pick up the project instructions:

Claude Code -- reads CLAUDE.md
Cursor -- reads .cursorrules
GitHub Copilot -- reads .github/copilot-instructions.md
Windsurf -- reads .windsurfrules
ChatGPT / other -- paste the contents of INSTRUCTIONS.md at the start of your conversation
All of these point to the same INSTRUCTIONS.md file. Just open the project in your tool and start working.

Session protocol:

When you start working, tell your AI to check the docs (it should do this automatically if you say start session)
When you're done, say "I'm done" and it will log your session to docs/SESSION-LOG.md so the next person knows what happened
Git workflow:

Never work directly on main
Create a feature branch: git checkout -b feature/your-feature-name
Use conventional commits: feat:, fix:, chore:, docs:
Open a PR to main -- CI runs automatically
Get one review, squash merge, delete the branch
Key files:

INSTRUCTIONS.md -- project rules and requirements
docs/CONTEXT.md -- current project status
docs/SESSION-LOG.md -- who did what when
plans/2026-04-06-intex-master-plan.md -- full sprint plan with task assignments
