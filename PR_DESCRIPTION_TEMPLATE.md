## What changed

- Added/updated ML UI panels across `donors`, `caseload`, and `social-media` pages with clearer, 9th-grade explanations and consistent tooltip UX.
- Replaced mixed tooltip patterns with shared styled components:
  - `QuestionTooltip` for `?` help tooltips
  - `InlineHoverTooltip` for inline value tooltips (USD conversion hover on PHP values)
- Improved table usability:
  - Donor churn: highest churn first + 10-row pagination + total-aware page/row display
  - Caseload ML tables: sorted views + 10-row pagination
- Added robust social fallback insights (historical, explanatory analytics) when predictive social ML is empty:
  - New backend endpoint: `GET /api/SocialMedia/insights-summary`
  - New frontend hook/types/panel for strategy insights:
    - best platform
    - best content type (donation impact vs likes)
    - best time of day
    - recommended posting frequency
- Removed broken staff nav item for `/social` and kept `/social-media`.
- Fixed donor high-value default `asOf` behavior in backend to use latest available donation month (instead of current date) to avoid empty results when current month has no snapshot rows.
- Added root-level `PR_DESCRIPTION_TEMPLATE.md` for easy copy/paste PR descriptions.

## Why

- Improve clarity and usability for non-technical staff by simplifying ML language and surfacing metric definitions directly in context.
- Reduce confusion and dead ends (broken nav links, empty predictive states with no fallback insights).
- Make decision support useful even without a deployed FastAPI service by providing historical strategy insights from existing DB data.
- Standardize tooltip behavior/appearance across pages for a consistent UX.
- Ensure donor high-value endpoint uses realistic default snapshot timing based on available data.

## How to test

1. Run services locally:
   - `python -m uvicorn ml_api.main:app --host 127.0.0.1 --port 8010`
   - `dotnet run` (from `backend/backend`)
   - `npm run dev` (from `frontend`)
2. Verify routing/nav:
   - Staff header no longer shows `Social` (`/social` removed)
   - `Social Media` route still works (`/social-media`)
3. Donors page (`/donors`):
   - Donor churn table is sorted by highest churn first
   - Pagination is 10/page with `Page X / Y` and `Showing A-B of N`
   - `?` tooltip definitions appear on churn columns
4. Caseload page (`/caseload`):
   - Three ML tables sorted as designed
   - Pagination is 10/page
   - `?` tooltips show metric definitions
5. Social Media page (`/social-media`):
   - Historical insights panel renders bars and recommendations
   - `?` tooltips explain strategy sections
   - PHP values show USD conversion tooltip on hover
   - ML social forecast panel still renders and behaves gracefully if no predictive rows
6. Tooltip consistency:
   - `?` tooltips use same styled bubble format across ML/social sections
   - USD tooltips use the same bubble styling (without question icon)
7. Backend endpoint checks:
   - `GET /api/SocialMedia/insights-summary` returns JSON summary
   - `GET /api/Ml/deployment-status` still returns healthy status shape
8. Production note:
   - Predictive `/api/Ml/*` endpoints require a deployed FastAPI host and `Ml__BaseUrl` set in environment config.

## Checklist

- [x] `dotnet build` passes (or `dotnet run` succeeds after restart)
- [x] `npm run build` passes
- [ ] No secrets or credentials in code
- [ ] New API endpoints have `[Authorize]` where needed
- [ ] Pages are responsive (desktop + mobile)
- [ ] Lighthouse accessibility >= 90% on affected pages
- [x] Updated `docs/SESSION-LOG.md` if this is end-of-session work

## Screenshots (if UI change)

- Donors page: churn table sorting + pagination + tooltips
- Caseload page: three ML tables with tooltips/pagination
- Social Media page: historical insights panel + social forecast + USD tooltip behavior
- Mobile screenshots for at least donors + social pages
