# Phase S4 — Real data and the UX the data needs. Paste into a fresh SONNET session, ONLY after O3 is merged and plan §9 records the live API base.

Read `fable/REVIEW.md` and `fable/plan.md` FIRST, in full — plus §9 and `KNOWN-ISSUES.md`.
Execute plan §6.1 under the autonomy protocol §4. Build nothing outside the plan.

HARD LIMITS (§4.7): do not change `src/types/listing.ts` shapes, `API_CONTRACT.md`,
`src/api/client.ts` transport (URL building, timeout, error type), `app.json` identifiers,
or anything in propia.node. If something seems to need it: workaround + note in plan §10.
Data only via `getListings` / `getListing` / `getMeta`.

Phase rules:
- Branch `phase/s4` off latest `main`. O3 unmerged or §9 lacks the live URL ⇒ stop, report.
- Load skill `paraguay-business-apps` (es-PY copy, guaraní formatting, WhatsApp-first).
- Run against real data: `EXPO_PUBLIC_USE_MOCK=false`. Mock mode must keep working too.
- Use `expo-image` for every remote image; cards use `thumbUrl`, gallery uses `url`.
- Filter state lives in the URL params so back navigation and deep links keep it.
- Keep the visual language (`#0B1B2B`, slate greys, 12px radius); no new UI libraries.
- Re-runnable; minor issues → `KNOWN-ISSUES.md`; stop only per §4.4.

Exit (all must hold, verified on a device or simulator against live data):
- CI green (typecheck, lint, exports, verify-format).
- Scrolling loads at least two pages; pull-to-refresh works; error state has a retry.
- A PYG rental shows `₲ … /mes`; a USD sale shows `US$ …` without `/mes`.
- A listing with 3+ images swipes through a gallery with a counter.
- City filter count equals the same filter's count on the website; barrio narrows further.
- `/propiedad/<slug>-<publicId>` deep link opens the right listing; unknown route shows not-found.
- Screenshots (list, detail, filters) attached to the PR; PR merged; §9 entry committed.

## After this phase — hand off to S5 (fresh session)
Four gates (§4.9) pass. Then `create_session` with `model` = Sonnet (never Fable), inherit
environment and permission mode (never `plan`), `prompt` exactly:
`Read fable/prompts/sonnet-5-store-readiness-docs.md in this repo and execute it.`
Fallback without `create_session`: continue in this window (same model). Never hand off red.
