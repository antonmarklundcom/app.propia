# Phase O3 — Read API in propia.node. Runs in a fresh OPUS session opened on antonmarklundcom/propia.node, ONLY after O2 is merged in app.propia.

You are in **propia.node**. Read its `CLAUDE.md` and `PLAN.md` first — they win on every
convention. Then read, from the app.propia clone: `fable/plan.md` (§1, §4, §5.3, §9) and
`API_CONTRACT.md` (the spec). Execute plan §5.3 under the autonomy protocol §4.

Phase rules:
- `git fetch origin main && git reset --hard origin/main`, then branch `claude/app-api-v1`.
- Load skills `propia-dev` and `nextjs-deploy-hostinger` (env, Hostinger, no staging).
- Never edit `drizzle.config.ts`, `src/db/index.ts`, env handling, schema, auth, or payments.
  If the contract seems to need any of those, stop and ask (§4.4).
- Mirror `app/api/mapa/route.ts` exactly: `force-dynamic`, `currentVertical()`,
  `parseFacetParams`, reuse `src/lib/queries.ts`, `allowRequest` from `src/lib/rate-limit.ts`.
- Published rows only; never return internal columns (list in plan §5.3.2).
- Add `scripts/verify-api-v1.ts`, the `.well-known` templates, and the `/api/leads` webhook timeout + `after()` port (plan §5.3.3–4, §5.3.6).
- `npm run verify:local` before every push. Hostinger auto-deploys `main`.
- Re-runnable; minor issues → propia.node `KNOWN-ISSUES.md` or PLAN.md per its convention.

Exit (all must hold):
- `GET /api/v1/listings`, `/api/v1/listings/:publicId`, `/api/v1/meta` return contract-shaped
  JSON with `Cache-Control` + `X-LiteSpeed-Cache-Control`; a draft `publicId` returns 404; bursts hit 429.
- `verify-api-v1` passes against local `next start`; `npm run verify:local` green.
- PR merged; after deploy, `curl -sI https://realestateinparaguay.com/api/v1/listings` shows
  200 + both cache headers and a second call shows `X-LiteSpeed-Cache: hit` (or a PLAN.md `[YOU]` item to enable LSCache); PLAN.md updated (incl. `[YOU]` item for TEAMID/SHA-256).
- In app.propia: one commit on `main` adding the live base URL and a §9 entry to `fable/plan.md`.

## After this phase — hand off to S4 (fresh SONNET session in app.propia)
Four gates (§4.9) pass, including the app.propia §9 commit. Then call `create_session` with
`model` = Sonnet (never Fable), inherit permission mode (never `plan`),
`source_url` = `https://github.com/antonmarklundcom/app.propia`, `prompt` exactly:
`Read fable/prompts/sonnet-4-real-data-ux.md in this repo and execute it.`
Fallback without `create_session`: stop and report (model switch). Never hand off red.
