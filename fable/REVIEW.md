# app.propia — repo review (2026-09-02)

Reviewed on branch `claude/fable-repo-review-plan-i4m16w`, head `d41d384` + one fix commit.
Companion repo `antonmarklundcom/propia.node` read at `be89c85` (2026-08-26) to verify
every cross-repo claim below. Depth: full read of all 9 source files (≈500 LOC), docs,
manifest; ran install, typecheck, lint, audit, and an offline Metro export.

## 1. Verdict

- **What it is:** a 9-file Expo (React Native) scaffold for a mobile client of the
  Paraguay listings site. Runs on hard-coded mock data. No users, no CI, no lockfile.
- **State:** typechecks green; lint broken; fresh clone could not start Metro (fixed here);
  pinned to Expo SDK 52, five majors behind current (57).
- **What matters most:** (1) its whole premise is stale: `propia.com.py` is not owned and
  the *propia* brand was dropped in propia.node on 2026-08-17, yet every identifier here
  (app name, bundle id, scheme, deep-link domain, API base, WhatsApp copy) is *propia*;
  (2) the API it is written against does not exist in propia.node, and the contract it
  specifies already drifts from the live schema (no price currency); (3) the toolchain
  (SDK 52, no lockfile, no lint config, no CI) has to be brought current before any
  further feature work, or it will be redone.

## 2. Findings

Severity: blocker = nothing useful can ship until fixed; high = must fix before the next
feature phase; medium = will bite when real data lands; low = polish.

| id | sev | area | where | what is wrong | why it matters | fix sketch |
|---|---|---|---|---|---|---|
| F1 | blocker | identity / product | `app.json:3-5,15-16,21-23`; `src/api/client.ts:18`; `app/listing/[id].tsx:62`; README, ARCHITECTURE.md, API_CONTRACT.md throughout | Everything is branded `propia` / `propia.com.py` / `com.propia.app`. propia.node `CLAUDE.md` ("Domains" table, 2026-08-17) states the domain is **not owned**, the `propia` vertical was deleted, and the founder ruled out *propia* as a visible brand. Live site is `realestateinparaguay.com`; `inmobiliaria.com.py` is the incoming Spanish primary (PLAN.md D6). | Bundle ids and associated domains are near-permanent once a store build exists. Universal links to `propia.com.py` will never verify. | Anton picks the brand/domain (Q1). Then one pass renames app name, slug, scheme, bundle/package ids, associated domains, API base, and copy. Repo can keep its name. |
| F2 | blocker | data / product | propia.node `app/api/` has only `health`, `leads`, `mapa` | `GET /api/v1/listings` and `/listings/:publicId` (API_CONTRACT.md) are unbuilt. ARCHITECTURE.md §4 Fas 1 is unticked; propia.node's docs never mention this app. | 100% of the app's data is mock; nothing in this repo can be verified against reality until the API exists. | Opus phase in propia.node: route handlers reusing `src/lib/queries.ts` (`getFilteredCategoryListings`, `getListingByPublicId`), `src/lib/facets.ts` for param parsing, `src/lib/rate-limit.ts`, `force-dynamic` + `Cache-Control`. Obey propia.node CLAUDE.md. |
| F3 | blocker | build | `package.json` deps (before fix) | Fresh clone + `npm install` nests `expo-asset` under `expo/node_modules`; `npx expo export` dies with "The required package `expo-asset` cannot be found". Metro never starts. | README's dev loop is dead on arrival. | **Fixed in this session** (commit `9320775`): `expo-asset ~11.0.5` declared directly. Verified: export produces a 2.64 MB Hermes bundle. |
| F4 | high | toolchain | `package.json:15-23` | Pinned Expo SDK 52 (Nov 2024). Registry today: expo 57.0.19, expo-router 57.0.18, RN 0.87. Also patch drift inside SDK 52: `react-native 0.76.5` vs expected `0.76.9`, `expo-router ~4.0.0` vs `~4.0.22`. Expo Go in the stores runs only the current SDK, so "skanna QR med Expo Go" fails on an up-to-date phone. | Every UI phase built on SDK 52 gets rebuilt after the inevitable upgrade; store submission toolchains (Xcode/target SDK) ratchet yearly. | Upgrade to the current stable SDK first (`npx expo install expo@latest && npx expo install --fix`), commit lockfile, fix breakages, then build. |
| F5 | high | DX / CI | `package.json:12` | `npm run lint` = `expo lint`, but no ESLint config or eslint deps are committed; it tries to auto-configure by calling api.expo.dev and crashes offline. | The only quality gate besides tsc does not exist. | Commit `eslint.config.js` + `eslint`/`eslint-config-expo` matching the SDK; make it a CI step. |
| F6 | high | DX / CI | repo root: no `package-lock.json`, no `.github/` | No lockfile, no CI, no tests. Nothing gates a push. | Non-reproducible installs (F3 was a symptom); regressions land silently. | Commit lockfile; add GitHub Actions: `npm ci`, typecheck, lint, `npx expo export --platform ios,android` (offline-safe bundle check). |
| F7 | high | contract / money | `API_CONTRACT.md:172-181`; `src/types/listing.ts:34-62`; propia.node `src/db/schema.ts:92-94` | Contract exposes only `priceUsd`. Schema has `price_amount` + `price_currency (USD/PYG)`; rentals are commonly priced in guaraníes. `ListingCard.tsx:16` and `[id].tsx:39` render every price as `US$` with no `/mes` for `alquiler`. Contract also ignores `title_en/description_en`, the thumb-vs-full image split (`imageThumbUrl` in propia.node `src/lib/format.ts`), and per-host vertical filters (`src/config/verticals.ts` `filters`). | Wrong prices shown to buyers is the one thing a listings app must never do. The contract is unbuilt, so changing it now is free; after the API ships it is a v2. | Rewrite contract v1 before F2 is built: add `priceAmount`, `priceCurrency`, `coverImage.thumbUrl`, optional `titleEn/descriptionEn`; state the host the API is served on and that vertical filters apply; keep `priceUsd` for filtering. Mirror into types + mock + format helpers. |
| F8 | medium | correctness | `app/index.tsx:13-20,41`; `src/api/client.ts:29,52-53` | List always requests page 1 and renders `total` ("137 propiedades") but can never load beyond 20. | Real data makes the count a lie and hides most inventory. | `useInfiniteQuery` + `onEndReached`; client returns `page/pageSize/total` already. |
| F9 | medium | deep links | `app.json:15,20-26`; `app/` has only `index.tsx`, `listing/[id].tsx` | iOS `applinks:` and Android intent filter claim `/propiedad/*`, but no route matches `/propiedad/{slug}-{publicId}`; no `+not-found.tsx`. A universal link lands on expo-router's unmatched screen. `autoVerify` also needs `assetlinks.json` / AASA on the web host (not in this repo). | Links from the site into the app are the app's main acquisition path and are silently broken. | Add `app/propiedad/[slug].tsx` (or `+native-intent.ts` redirect) that extracts the trailing 10-char `publicId` and routes to `listing/[id]`; add `+not-found.tsx`; AASA/assetlinks files go to propia.node `public/.well-known/` (needs Apple Team ID → human input). |
| F10 | medium | config | `src/api/client.ts:19` | `USE_MOCK` is a hard-coded `true`. Swapping needs a code edit and cannot differ per build profile. | Dev/preview/prod builds must be able to point at different backends without a commit. | Derive from `process.env.EXPO_PUBLIC_USE_MOCK` (default `true` only in `__DEV__`); commit `.env.example`. |
| F11 | medium | resilience | `app/_layout.tsx:5`; `src/api/client.ts:31,37`; `app/listing/[id].tsx:9-12` | `QueryClient` has no `staleTime`/`retry` tuning; `fetch` has no timeout/AbortController; detail query fires with `id` possibly `undefined` (no `enabled`). propia.node's 2026-07-26 post-mortem is precisely about requests that never resolve. | On flaky mobile networks the UI spins forever; retries on a 500 hammer the shared Hostinger process. | Wrap fetch with a 10 s `AbortController`; set `retry: 1`, `staleTime: 5 min`; `enabled: !!id`. |
| F12 | low | UI | `app/_layout.tsx:10`; `app.json:7` | `StatusBar style="dark"` forced while `userInterfaceStyle: "automatic"`. | Dark-mode users get an invisible status bar. | `style="auto"`, or set `userInterfaceStyle: "light"` until a dark theme exists. |
| F13 | low | UI | `src/components/FilterBar.tsx:4-17` | Chips omit `alquiler_temporal`, `oficina`, `deposito`, `quinta` although the types (and the DB enum, verified) include them. | Those listings are reachable only via "Todos". | Generate chips from a single labelled enum list shared with `format.ts`. |
| F14 | low | UI | `app/listing/[id].tsx:35-37`; `src/types/listing.ts:57` | Detail shows only `coverImage`; `images[]` is never rendered; RN `Image` used without caching. | Gallery is table stakes for a listings app. | Horizontal paged gallery with `expo-image`. |
| F15 | low | assets | `app.json:10` → `./assets/icon.png`; no `assets/` dir | Icon path points at a missing file. Dev tolerates it; `expo prebuild`/EAS build fails. | Blocks the first store build. | Add placeholder icon/splash/adaptive icon in the chosen brand colours. |
| F16 | low | security (dev only) | `npm audit`: 32 advisories, 1 critical (`tar` via `@expo/cli`), all in the SDK 52 dev toolchain | Nothing in shipped app code is affected. | Noise, but it disappears with F4. | Resolved by the SDK upgrade; re-run audit after. |
| F17 | low | docs | `README.md`, `ARCHITECTURE.md` §1 (dated 2026-07-12), `API_CONTRACT.md` | State facts that are now false: "propia.com.py är inte lanserad", "aktiv produktionsincident" (resolved per propia.node PLAN.md), propia branding, mock-only dev loop. | Next session orients from these and rebuilds on a false premise (this review nearly did). | Rewrite after the rebrand decision; make `fable/plan.md` §9 the state of the world until then. |
| F18 | low | mock | `src/api/mockData.ts:10-11` | Mock images hotlink `picsum.photos`. | Fine for mock; must never be in a store build. | Guard: `EXPO_PUBLIC_USE_MOCK` cannot be true in a `production` EAS profile. |
| F19 | info | hosting/process-cap | this repo: `git ls-files` (16 files), `package.json:7-13` | **This repo runs no server.** No `next`, no `next-server`, no DB pool, no `.htaccess`/ecosystem/Procfile/server file, nothing deployed to Hostinger. The 2–3 `next-server` processes seen over SSH belong to **propia.node**. | The investigation's premise points at the wrong repo; nothing here can raise or lower the instance count. | Read §6 below, which runs the same investigation on propia.node. |
| F20 | medium | hosting/process-cap | propia.node: `git ls-files`, `package.json` scripts, `next.config.ts` | No repo-side instance/worker configuration exists in propia.node either: no `.htaccess`, `ecosystem.*`, `Procfile`, `server.js`, `instrumentation.ts`, `engines`, or `NODE_OPTIONS`; `start` is plain `next start`. Instance count is therefore entirely the hosting panel's LiteSpeed Node-app setting. | Same result as the sibling-repo audits: the knob is in hPanel, not git. | Anton checks the Node.js app's settings in hPanel (instances / max connections per instance) and pins it to 1 while there are zero users (§6.4). |
| F21 | ok | hosting/process-cap | propia.node `src/db/index.ts:30-42` | Pool is the bounded-queue pattern: `connectionLimit 6`, `maxIdle 6`, `idleTimeout 30 s`, `waitForConnections true`, `queueLimit 24`, `connectTimeout 8000`. | Matches the fix shipped elsewhere on the account. Note the multiplier: each `next-server` instance owns its own pool, so 3 instances = up to 18 MySQL connections and 72 queued requests. | Nothing to change in code. One more reason to run one instance. |
| F22 | high | hosting/process-cap | propia.node `src/lib/crm.ts:102`, `app/api/leads/route.ts:187` | `POST /api/leads` **awaits** `pushLead()`, which is a bare `fetch(webhookUrl)` with no timeout/AbortSignal, whenever `LEAD_WEBHOOK_URL` or `GHL_WEBHOOK_URL` is set (`crm.ts:160`). Node's fetch waits up to 300 s for headers by default. A slow or hanging GHL endpoint holds the handler, and therefore the process, open. | This is the exact "request that never resolves keeps its process alive" mechanism from the 2026-07-26 post-mortem, reintroduced through a different dependency. The operator alert on line 173 is already correctly deferred with `after()`; the lead push is not. | **Fixed 2026-09-02** on propia.node branch `claude/leads-webhook-timeout`: `AbortSignal.timeout(12_000)` on the fetch in `post()`, timeout classified in the error string. Proven with a never-responding sink (12.0 s, `ok:false`). Merge it; O3 §5.3.6 then only needs the `after()` move, which is optional. |
| F26 | medium | hosting/process-cap | propia.node `scripts/{recompute-cuotas,compute-medians,resync-stale,sync-display-coords,translate-listings,purge-sessions}.ts` | **No cron script has a lock or in-progress guard.** All six exit cleanly (`process.exit` on both paths, so no zombie), but nothing stops a second run starting while the first is still going. Five are DB-only and bounded by the pool's 8 s connect timeout; **`translate-listings.ts` is not**: it calls the Anthropic SDK sequentially (default 10-minute per-call timeout, 2 retries) over pages of 500 rows with no limit unless `--limit` is passed, so one run can take hours. | On a fixed schedule an hours-long run overlaps the next one: each overlap is another `tsx` Node process with its own 6-connection pool. This is the 189/200 shape from cron instead of requests. Per PLAN.md:472 no cron is scheduled yet, so today this is latent. | Schedule every job through `flock -n <lockfile> …` in the hPanel command (§6.5), and always pass `--limit` to `cron:translate`. Code-level `GET_LOCK` guard is a propia.node backlog item. |
| F27 | low | hosting/process-cap | propia.node `README.md:77-79` vs `package.json` scripts, `PLAN.md:472` | Deploy docs tell the operator to schedule "counts hourly, sitemap nightly", but no such scripts exist; the six real `cron:*` jobs are elsewhere in the README. PLAN.md still lists the cron setup as an open `[ ]` item. | An operator following the README schedules the wrong things or nothing; the repo cannot tell you what runs. | Rewrite README step 4 to the real job list with intervals and the `flock` form; tick or update PLAN.md:472 once hPanel is checked. |
| F23 | medium | hosting/process-cap | propia.node: 39 routes `export const dynamic = "force-dynamic"`; `app/page.tsx:66-68`; `app/propiedad/[slug]/page.tsx:51,137,222` | Every public page renders per request (host header is a dynamic API), with 9 DB queries per category/detail view per the post-mortem. Only directory lists, medians, financing and sitemap entries sit behind `unstable_cache`. `next/image` is unused (0 imports), so no in-process `sharp` on the request path (`sharp` is only in `src/lib/images.ts`, the upload path). | Slow-ish, DB-bound requests raise concurrency; concurrency above one instance's connection limit is what makes LiteSpeed start a second and third instance. With zero users that concurrency comes from crawlers hitting up to 25 000 sitemap URLs (`src/lib/sitemap-xml.ts:44-46`). | Not this plan's scope beyond the API: O3 must serve `/api/v1/*` with cache headers LiteSpeed honours (`Cache-Control` **and** `X-LiteSpeed-Cache-Control`) and prove a cache hit after deploy (§5.3.2). Whole-site caching is a propia.node backlog item. |
| F24 | low | hosting/process-cap | propia.node `app/api/health/route.ts`, `app/api/health/db/route.ts:40-60`, `src/lib/rate-limit.ts:22-28`, `src/lib/auth/rate-limit.ts:54-63` | Health probes are sound: `/api/health` touches nothing; `/api/health/db` is `SELECT 1` bounded by the pool's 8 s timeout and answers 503 on failure. No module-level timers; the two in-memory maps are swept each window, so no unbounded memory growth was found. Nothing in the repo registers either route as a LiteSpeed/uptime health check. | If an external monitor polls `/api/health/db` and the pool is saturated, it will see 503s, which some panels treat as "restart the app". That would explain restarts, not extra instances. | Point any uptime monitor at `/api/health`, not `/api/health/db`; keep the db probe for humans. |
| F25 | low | hosting/process-cap | propia.node `next.config.ts` (`output: "standalone"`) vs `package.json` `start: next start` | The build emits a standalone server, but the start script runs `next start`. Whichever one Hostinger executes, the other is dead weight; if it runs `npm start`, the standalone output is built and never used. | Confusing during incident triage ("which server is this?"), and doubles build output on a plan at 96 % of resources. | Pick one: drop `output: "standalone"`, or set `start` to `node .next/standalone/server.js` and confirm hPanel's start command matches. |

Checked and found clean: WhatsApp deep link construction (`wa.me` + digits-only number, encoded text), no secrets in repo, `.gitignore` covers `.env*`, TS `strict` on, `@/` alias resolves, `Link asChild` card navigation works, es-PY formatting mirrors the web.

## 3. What is good — do not "improve" away

- **Type mirror is exact.** `Operation`, `PropertyType`, `PropertyState` in `src/types/listing.ts` match propia.node `schema.ts` enums value-for-value (verified). Keep the "same names as the DB, camelCase" rule.
- **Single data seam.** Screens import only `getListings`/`getListing` from `src/api/client.ts`. Keep this; the mock/HTTP switch and any auth header live there and nowhere else.
- **Mock data has the detail shape and derives summaries** (`toSummary`), so mock and API can never diverge in shape. Keep.
- **Small and boring.** No state library, no theming framework, no Tailwind-for-RN. Expo Router + React Query is the right size. Do not add Redux/Zustand/NativeWind in a fix-and-harden plan.
- **Spanish UI copy, Swedish docs, English code** is the convention. Keep.
- **The "no new hosting, same process, /api/v1 in propia.node" decision** (ARCHITECTURE.md §2) is still right and matches propia.node's single-app-many-hosts design.

## 4. Open questions for Anton (decisions only he can make)

1. **Which brand/domain does the app belong to?** Recommended: `inmobiliaria.com.py` (the Spanish primary per propia.node PLAN.md D6; the domain is the brand). App display name `inmobiliaria.com.py`, iOS bundle id / Android package `py.com.inmobiliaria.app`, scheme `inmobiliaria`, associated domain `inmobiliaria.com.py`, API base `https://inmobiliaria.com.py/api/v1`. If the D6 flip is not done by the time the API ships, the same routes also answer on `realestateinparaguay.com` (same app), so nothing blocks.
2. **Build the read API in propia.node now?** Recommended: yes, as Opus phase O3 of this plan, in that repo, on a `claude/` branch per its CLAUDE.md. Without it every later phase here stays hypothetical. It also touches nothing "flag before merging" (no auth, payments, schema).
3. **Expo SDK target.** Recommended: the current stable at phase start (57 today). Not 53 or 54 — one upgrade, not two.
4. **Rentals in guaraníes.** Recommended: yes, add `priceAmount`/`priceCurrency` to contract v1 (F7). Costs nothing now, a v2 later.
5. **Spanish only for v1?** Recommended: yes. The API may carry `titleEn/descriptionEn` optionally; the app ignores them until an EN door exists.

## 6. Hostinger process-cap investigation

Requested as "specific to this repo". **The premise does not hold for app.propia**: it is an
Expo client, has no server process, no deploy artefact and no database connection (F19).
The `next-server` processes are propia.node's, so the investigation was run on propia.node
at `be89c85` (read-only clone). hPanel, SSH, LiteSpeed config and access logs were not
reachable from this session; everything below is from the two repositories.

### 6.1 Deploy config that sets instance/worker count

None, in either repo. Searched tracked files for `.htaccess`, `ecosystem.*`, `Procfile`,
`server.*`, Dockerfile, `instrumentation.*`, `lsnode`/LiteSpeed/Hostinger manifests,
`.nvmrc`/`.node-version`, `engines`, `NODE_OPTIONS`. propia.node has only `next.config.ts`
(images, `output: "standalone"`, headers) and `.npmrc` (pnpm build allowlist). Its start
script is `next start`. Conclusion: instance count is set in the hosting panel's Node.js app
configuration, exactly as the sibling-repo audits found (F20).

### 6.2 What could make LiteSpeed spawn extra instances instead of reusing one

LiteSpeed starts another Node instance when concurrent requests exceed what the running
instance is allowed to hold, and reaps idle ones later. So the question is "what makes
requests slow or concurrent": 

- **Untimed outbound call in the request path (F22, high).** `/api/leads` awaits the CRM
  webhook with no timeout. One slow GHL response = one handler held open for up to 300 s =
  one process that cannot serve. This is the post-mortem's mechanism through a new door.
- **Per-request SSR everywhere (F23, medium).** 39 `force-dynamic` routes plus the home and
  detail pages, which are dynamic because the host header is read. About 9 queries per view.
  Crawlers walking the sitemap (up to 25 000 URLs per chunk set) are the realistic source of
  concurrency on a site with zero users.
- **Keep-alive:** nothing configured in the repo (no `--keepAliveTimeout`, no custom server).
  Defaults apply; not a cause I could confirm.
- **Health checks (F24, low):** both probes are correct and cheap; neither is registered as a
  LiteSpeed health check in the repo. If an external monitor polls `/api/health/db` during
  pool saturation it gets 503s, which explains restarts, not spawns.
- **Memory growth:** no module-level timers, and both in-memory maps (`rate-limit.ts`,
  `auth/rate-limit.ts`) are swept each window. `next/image` is unused, so `sharp` never runs
  in the request path. No growth source found.
- **Thread count:** ~11 threads per `next-server` is Node's baseline (main thread, 4 libuv
  workers, V8 platform workers, inspector). Not tunable from the repo in any useful way.

### 6.3 DB pool

`src/db/index.ts:30-42` is the bounded pattern: `connectionLimit 6`, `queueLimit 24`,
`connectTimeout 8000`, `waitForConnections true`, `maxIdle 6`, `idleTimeout 30 s` (F21).
Because every instance owns a pool, three instances mean up to 18 connections and 72 queued
requests against Hostinger's per-user MySQL limit. Correct code, wrong multiplier.

### 6.4 Does traffic justify multiple instances?

No, on the evidence available. propia.node CLAUDE.md line 414 states "Zero live users". No
analytics integration exists in the code (no gtag, Plausible, Umami, PostHog), and no logs
were reachable from here. What remains is crawler and monitor traffic. Two or three standing
`next-server` instances for that is waste against a shared 200-process cap, and each carries
its own MySQL pool.

### 6.5 Follow-up investigation (2026-09-02, later the same day)

**Fixed now.** F22, the untimed webhook, is fixed on propia.node branch
`claude/leads-webhook-timeout` (commit message carries the verification). Not merged: merging
deploys to production and the repo's CLAUDE.md asks for a flag on request-path changes.

**DB pool re-confirmed (item 4).** Exactly one `mysql.createPool` call in the codebase,
`src/db/index.ts:22`, at module scope, exported once as `db`. No pool is created per request.
All explicit: `connectionLimit 6`, `queueLimit 24`, `connectTimeout 8000`, plus `maxIdle`,
`idleTimeout`, `waitForConnections`. Every cron script imports that same module, so each
cron *process* gets one pool, which is correct for a separate process. The only other
connection site is `scripts/check-migrations.ts:85`, a single direct connection that is
closed at line 357. The July fix is complete.

**Cron scripts (items 2 and 3).** What the repo says is scheduled:

- `PLAN.md:472` — `[ ] hPanel cron jobs: cron:cuotas, cron:medians (nightly)` is still open.
- `README.md:77-79` — "schedule `npx tsx scripts/<job>.ts` (medians nightly, cuota nightly,
  counts hourly, sitemap nightly)". Two of those four do not exist as scripts (F27).
- `ARCHITECTURE.md:79` — "hPanel cron → `npx tsx scripts/*.ts`; every job idempotent +
  checkpointed".

So by the repo's own record, **nothing is scheduled yet**. If hPanel says otherwise, the
docs are behind. Per script:

| script | network | bounded by | lock guard | overlap risk on a fixed schedule |
|---|---|---|---|---|
| `recompute-cuotas.ts` | DB only | pool timeouts | none | low; seconds per run |
| `compute-medians.ts` | DB only | pool timeouts | none | low |
| `resync-stale.ts` | DB only | pool timeouts | none | low |
| `sync-display-coords.ts` | DB only | pool timeouts | none | low |
| `purge-sessions.ts` | DB only | pool timeouts | none | low |
| `translate-listings.ts` | Anthropic API, sequential | SDK default 10 min per call, 2 retries; no run limit unless `--limit` | none | **high**: a run over hundreds of rows takes hours |

None of the six checks whether a previous run is still going (F26). All six exit via
`process.exit` on success and failure, so a finished run never lingers.

**What only you can check, exact steps:**

1. Cron list. hPanel → Websites → realestateinparaguay.com → Advanced → Cron Jobs. Or over
   SSH: `crontab -l`. Expected today: empty, or only `cron:cuotas` and `cron:medians`.
   For each entry note the command and the interval.
2. Overlap guard. Any entry must be of the form
   `cd ~/domains/<site>/public_html && flock -n /tmp/propia-<job>.lock npm run cron:<job>`
   and `cron:translate` must carry `-- --limit 25`. If `flock` is missing on the box,
   report it and the guard moves into the scripts (backlog).
3. Instance count. hPanel → Websites → the Node.js app for propia.node → application settings.
   Look for "instances", "max processes" or "max connections"; set instances to **1**.
4. Live process census over SSH, run twice ten minutes apart:
   `ps -eo pid,etime,nlwp,rss,cmd | grep -E 'next-server|tsx|node ' | grep -v grep`.
   `etime` tells whether the extra `next-server` processes are long-lived (panel setting)
   or minutes old (spawned on demand); `nlwp` is the thread count each one charges to the
   cap; any `tsx` row older than a few minutes is a cron run still going.
5. Log check. `~/logs` or hPanel → Analytics/Access log: count requests per minute on
   `/propiedad/` for one day. Crawler bursts there plus per-request SSR is the only
   remaining way this app raises concurrency.

**Updated confidence.** With the pool bounded (July) and the webhook bounded (now), and no
cron scheduled per the repo, propia.node's steady-state cost is instances × roughly 11
threads. At the 2 to 3 instances you observed that is about 33 of 200, one sixth of the cap.
I am confident it **cannot fill the cap on its own under that configuration**. Two ways it
still could, both checkable by the steps above: an uncapped instance setting letting
LiteSpeed spawn many `next-server` processes under a crawler burst (steps 3 to 5), or an
overlapping `cron:translate` schedule (steps 1 and 2). If both come back clean, the
remaining load is the neighbours, which is what the repo's own post-mortem already
concluded.

Recommended actions, in order (all outside this repo; only the O3 items are in this plan):
1. In hPanel, set the propia.node Node.js app to **1 instance** and record the setting in
   propia.node PLAN.md. Revisit only when an access log shows real concurrency.
2. Merge propia.node branch `claude/leads-webhook-timeout` (F22 fix, commit `07de6c2`).
   Hostinger deploys it on merge; check `/api/health` afterwards.
3. Pull one day of the LiteSpeed access log; if `/propiedad/*` crawler bursts dominate, the
   durable fix is response caching for public pages (propia.node backlog), and the mobile API
   must not add to it: O3 serves `/api/v1/*` with `Cache-Control` and
   `X-LiteSpeed-Cache-Control` and verifies an `X-LiteSpeed-Cache: hit` after deploy.
4. Point any uptime monitor at `/api/health`, not `/api/health/db`.
5. Resolve F25 so the running server is unambiguous during the next incident.

## 5. Fixed in this session

- `9320775` — declare `expo-asset ~11.0.5` as a direct dependency so Metro can start on a fresh clone (F3). Verified with `npm run typecheck` and `npx expo export --platform ios` (bundle produced).

- propia.node `07de6c2` on branch `claude/leads-webhook-timeout` — 12 s `AbortSignal.timeout`
  on the outbound webhook (F22). Typecheck, build, `verify:local` green; stalled-sink proof
  passed. Pushed, not merged, no PR.

Not fixed, by design: everything else is in `fable/plan.md`.
