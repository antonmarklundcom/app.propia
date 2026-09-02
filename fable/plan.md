# fable/plan.md — fix-and-harden plan for app.propia

Written 2026-09-02 from `fable/REVIEW.md`. This is the plan build sessions execute.
It **supersedes** `ARCHITECTURE.md` §4 (Fas 0–4) and `API_CONTRACT.md` "Status" as the
statement of what happens next; those files stay as background until phase S5 rewrites
them. `ARCHITECTURE.md` §2 (no new hosting, `/api/v1` inside propia.node) still holds.

Every phase: read `fable/REVIEW.md` for the why, this file for the what, §9 for the state.

| id | model | prompt file | plan sections | repo |
|---|---|---|---|---|
| O1 | Opus | `fable/prompts/opus-1-toolchain.md` | §5.1 | app.propia |
| O2 | Opus | `fable/prompts/opus-2-contract-identity.md` | §5.2 | app.propia |
| O3 | Opus | `fable/prompts/opus-3-listings-api.md` | §5.3 | **propia.node** |
| S4 | Sonnet | `fable/prompts/sonnet-4-real-data-ux.md` | §6.1 | app.propia |
| S5 | Sonnet | `fable/prompts/sonnet-5-store-readiness-docs.md` | §6.2 | app.propia |

Opus phases run first, in order; Sonnet phases after, in order. One phase = one PR.

---

## §1 Decisions already made — do not re-litigate

Existing repo rules:
- The app is a **read-only client** of propia.node's MySQL via `/api/v1/*` routes that live
  **inside the propia.node Next.js app**. No new Node slot, no new domain, no own backend.
- Code identifiers in English, UI copy in Spanish (es-PY), docs in Swedish.
- `src/types/listing.ts` mirrors propia.node `src/db/schema.ts` field names 1:1 (camelCase).
  Internal columns (`reviewNotes`, `ownerUserId`, `addressText`, `foreignExposure`…) are never
  exposed.
- Screens talk to data only through `src/api/client.ts` (`getListings`, `getListing`).
- Stack: Expo + expo-router + @tanstack/react-query + TypeScript strict. No extra state or
  styling libraries.
- `/api/v1` is a frozen contract **once the API ships**; breaking changes go to `/api/v2`.

Review recommendations adopted without needing Anton:
- Upgrade to the current stable Expo SDK before any other work (REVIEW F4).
- Commit `package-lock.json`, an ESLint config, and a GitHub Actions gate (F5, F6).
- Contract v1 carries `priceAmount` + `priceCurrency` (`USD`|`PYG`) next to `priceUsd`, a
  `thumbUrl` on cover images, and optional `titleEn`/`descriptionEn` (F7).
- `USE_MOCK` becomes `EXPO_PUBLIC_USE_MOCK` (F10); fetch gets a 10 s timeout, React Query
  gets `retry: 1`, `staleTime: 5 min` (F11).
- List paginates with `useInfiniteQuery` (F8). Deep-link route `/propiedad/[slug]` maps to
  the detail screen (F9).
- Filters (chips) derive from one labelled enum list covering all DB values (F13).
- Spanish only in v1 (Q5 recommended answer, treated as decided unless Anton objects).

Pending Anton (see REVIEW §4 and §8 below): the brand/domain (Q1). **Until answered, O2
uses the recommended answer**: display name `inmobiliaria.com.py`, ids
`py.com.inmobiliaria.app`, scheme `inmobiliaria`, API base
`https://inmobiliaria.com.py/api/v1`. All of these live in exactly three places after O2
(`app.json`, `.env.example`, `src/config/brand.ts`) so a different answer is a 5-minute change.

## §2 Roles & object model

No roles: the app has no accounts in this plan (ARCHITECTURE.md Fas 4 "konton" is Backlog).
Objects are the public projections of propia.node rows:

- `ListingSummary` — list/card shape. Adds in O2: `priceAmount: number`,
  `priceCurrency: "USD" | "PYG"`, `coverImage.thumbUrl: string | null`.
- `ListingDetail extends ListingSummary` — adds `images[]` (each with `url`, `thumbUrl`,
  `width`, `height`, `position`), `agency`/`agent` contact, `descriptionEs`, optional
  `titleEn`/`descriptionEn`.
- `ListingsQuery` / `PaginatedListings` — unchanged shape; `pageSize` fixed at 20 server-side.
- `Meta` (new, O2/O3): `{ cities: { slug, name, count, barrios: { slug, name, count }[] }[] }`
  from `locations.listing_counts`, for the location filter.

Price display rule (O2, used by S4): `priceCurrency === "PYG"` → `formatGs(priceAmount)`,
else `formatUsd(priceAmount)`; `operation !== "venta"` appends `/mes`. `priceUsd` is for
filtering only and never shown when currency is PYG.

## §3 Feature scope

In scope (fix-and-harden; all already asked for by ARCHITECTURE.md Fas 2–3 or REVIEW):
1. Toolchain current and gated (O1).
2. Contract + types + identity corrected (O2).
3. Read API in propia.node (O3).
4. App on real data: infinite scroll, pull-to-refresh, correct prices, gallery, full filter
   chips, price/bedroom/location filters via `/meta`, deep-link route, not-found (S4).
5. Store readiness: icon/splash, `eas.json`, TestFlight/Play internal build docs, README and
   ARCHITECTURE rewritten to reality (S5).

Out of scope → §10 Backlog: map view, favourites, push for saved searches, accounts/OTP,
English UI.

## §4 Autonomy protocol (copied conceptually into every prompt)

1. Work until the phase's exit criteria all pass; never ask permission for in-plan work.
2. One PR per phase. In **app.propia**: branch `phase/<id>` off latest `main`. In
   **propia.node** (O3 only): branch `claude/app-api-v1` per its CLAUDE.md, and
   `git fetch origin main && git reset --hard origin/main` before branching. Create the PR,
   watch CI, merge when green. A red build is always the session's own work. Never start on
   top of an unmerged previous phase.
3. Minor non-blocking issues → `KNOWN-ISSUES.md` (repo root), keep building.
4. Stop and ask ONLY for: a missing credential with no graceful fallback, or a bad-foundation
   decision (contract shape, ids that become permanent in a store build, anything propia.node
   CLAUDE.md says to flag: auth, payments, DB schema). Everything else: choose reasonably,
   record it in §9, continue.
5. Missing env values never block: document in `.env.example`, degrade gracefully (mock mode).
6. Every prompt is re-runnable: check what exists on the branch first, continue from the
   first unmet exit criterion.
7. Sonnet hard limits: no changes to `src/types/listing.ts` shapes, `API_CONTRACT.md`,
   `src/api/client.ts` request/response handling, `app.json` identifiers, or anything in
   propia.node. Workaround + Backlog note instead.
8. **Model cost guardrail.** Fable (`claude-fable-5`, any Mythos-class model) is NEVER used
   for build phases, subagents, spawned sessions, workflows, or scheduled runs. Phase tables
   and `create_session` calls name only Opus or Sonnet. If a session believes Fable is
   genuinely needed, it stops and asks Anton with the reason; spawning Fable without his
   explicit approval in that conversation is treated like a destructive action. Fable's only
   role is the planning conversation Anton opens himself.
9. **Phase handoff.** Hand off only when four gates pass: PR merged green; exit checklist
   passed; pre-handoff audit done (re-run typecheck/lint/export or propia.node
   `verify:local`, adversarially re-read your own merged diff, fix findings); §9 entry
   committed on `main`. Then spawn the next phase as a NEW session via the claude-code-remote
   `create_session` tool: inherit environment and permission mode (never `plan`), set
   `model` per the phase table (Opus or Sonnet only, never Fable), `prompt` exactly
   `Read fable/prompts/<next-file>.md in this repo and execute it.` For O2→O3 the child
   session's `source_url` is `https://github.com/antonmarklundcom/propia.node` and the prompt
   is the one in `opus-2`'s footer. Fallback when `create_session` is unavailable: continue in
   the same window if the next phase uses the same model; stop and report at a model switch.
10. **Build log.** Before merging, append a 5–10 line dated entry to §9: phase id + PR, what
    now exists, decisions/deviations, where the next phase should look first. Fresh sessions
    orient from `fable/REVIEW.md`, this file, §9 and `KNOWN-ISSUES.md` ONLY.

## §5 Opus phases

### §5.1 O1 — Toolchain current and gated (app.propia)

1. Upgrade to the current stable Expo SDK: `npx expo install expo@latest`, then
   `npx expo install --fix`; move `react`, `react-native`, `expo-router`, `expo-status-bar`,
   `react-native-screens`, `react-native-safe-area-context`, `expo-asset`, `expo-constants`,
   `expo-linking` to the SDK's expected versions. Fix every breaking change (React 19 types,
   expo-router API, new architecture default). Keep `@tanstack/react-query` on latest 5.x.
2. Commit `package-lock.json`. `npm ci` must reproduce the install.
3. Add `eslint.config.js` (`eslint-config-expo` flat config for the SDK) and the eslint dev
   deps; `npm run lint` passes offline with zero warnings after fixing what it flags.
4. Add `.github/workflows/ci.yml`: on PR and push to `main`, Node 22, `npm ci`,
   `npm run typecheck`, `npm run lint`, `EXPO_OFFLINE=1 npx expo export --platform ios` and
   `--platform android` (bundle check; no EAS, no secrets).
5. Add placeholder `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`
   (solid `#0B1B2B` squares are fine) so `expo prebuild --no-install` succeeds. Reference them
   in `app.json`. Do NOT change any identifier in `app.json` in this phase (that is O2).
6. `StatusBar style="auto"` (REVIEW F12). `npm audit --omit=dev` shows no critical/high
   (F16) — if the SDK's own toolchain still carries advisories, record them in KNOWN-ISSUES.
7. Add `KNOWN-ISSUES.md` (empty header) and `.env.example` with `EXPO_PUBLIC_API_BASE` and
   `EXPO_PUBLIC_USE_MOCK` documented (values wired in O2).

Exit: CI green on the PR with all four steps; `npx expo prebuild --no-install` succeeds
locally; app renders list → detail → WhatsApp button in an iOS simulator or web
(`npx expo start --web`) on the new SDK; no `propia` string touched.

### §5.2 O2 — Contract, types, identity (app.propia)

1. Rewrite `API_CONTRACT.md` as **v1 (final before build)**: endpoints `/api/v1/listings`,
   `/api/v1/listings/:publicId`, `/api/v1/meta`; response shapes per §2; `status='published'`
   only; the host header decides the vertical (propia.node `src/config/verticals.ts`
   `filters` apply); `Cache-Control: public, max-age=300, stale-while-revalidate=600`;
   `force-dynamic`; rate limit via propia.node `src/lib/rate-limit.ts`; image URLs resolved
   with `imageUrl`/`imageThumbUrl` from propia.node `src/lib/format.ts`; params parsed with
   the same vocabulary as `src/lib/facets.ts` (`operacion`, `tipo`, `ciudad`, `barrio`,
   `precio_min`, `precio_max`, `dormitorios`, `pagina`) so web and app never disagree. State
   explicitly which propia.node query functions to reuse (`getFilteredCategoryListings`,
   `countCategory`, `getListingByPublicId`, `listCities`, `citySubtreeIds`). No `propia`
   wording anywhere.
2. Update `src/types/listing.ts`, `src/api/mockData.ts`, `src/api/client.ts` to the contract:
   new fields, `EXPO_PUBLIC_USE_MOCK` (default `true` only when `__DEV__`), 10 s
   `AbortController` timeout, typed error with status, `getMeta()`, `page` param passthrough.
   QueryClient defaults `retry: 1`, `staleTime: 5 * 60_000`. Detail query `enabled: !!id`.
3. `src/lib/format.ts`: `formatPrice(listing)` implementing the §2 price rule; unit-test it
   with `node --test` on a tiny `scripts/verify-format.ts` (tsx) — the one test this repo gets.
4. Identity: create `src/config/brand.ts` (`BRAND_NAME`, `BRAND_HOST`, `WHATSAPP_SUFFIX`);
   `app.json` name/slug/scheme/bundle id/package/associated domains/intent host per §1
   recommended answer (or Anton's answer if §9 records one). Replace every `propia` string in
   code with the brand config. Repo name stays.
5. Deep links: `app/propiedad/[slug].tsx` extracts the trailing 10-char `publicId` from
   `{slug}-{publicId}` and `router.replace('/listing/' + publicId)`; `app/+not-found.tsx`.
6. Filters: one exported `OPERATIONS`/`PROPERTY_TYPES` labelled list in `src/lib/labels.ts`
   covering every enum value; `FilterBar` and `formatOperation` consume it.

Exit: typecheck, lint, export, `verify-format` green in CI; grep for `propia` in `app/`,
`src/`, `app.json` returns nothing; mock mode still renders list/detail; deep link
`inmobiliaria://propiedad/casa-x-a1b2c3d4e5` opens the detail screen in the simulator
(`npx uri-scheme open ... --ios`); API_CONTRACT.md reviewed line by line against
propia.node `schema.ts` at its current `main`.

### §5.3 O3 — Read API in propia.node (repo: antonmarklundcom/propia.node)

Executed in a session opened on propia.node. Its `CLAUDE.md` and `PLAN.md` win on every
convention. This phase touches nothing on its flag-before-merge list (no auth, payments,
schema) — if implementing the contract seems to require any of those, stop and ask.

1. Clone app.propia read-only and read `API_CONTRACT.md` (post-O2) — it is the spec.
2. Add `app/api/v1/listings/route.ts`, `app/api/v1/listings/[publicId]/route.ts`,
   `app/api/v1/meta/route.ts`, mirroring `app/api/mapa/route.ts` (`force-dynamic`,
   `currentVertical()`, `parseFacetParams`, `NextResponse.json`). Reuse
   `src/lib/queries.ts`; add a query function only if none fits, in that file, following its
   style. Apply `allowRequest` from `src/lib/rate-limit.ts`. Set the `Cache-Control` header
   from the contract. Never return `addressText`, `reviewNotes`, `ownerUserId`,
   `foreignExposure`, or any non-published row.
3. Add `scripts/verify-api-v1.ts` (tsx) that hits the three routes against a running local
   `next start` and asserts shape + `published`-only + 404 on a draft + rate-limit 429; wire
   it into `verify:local` only if the existing verify scripts are structured that way,
   otherwise as its own script and document it in PLAN.md.
4. Add `public/.well-known/assetlinks.json` and `apple-app-site-association` **templates**
   with the app ids from app.propia `app.json` and `TEAMID` placeholders; record in
   propia.node PLAN.md `[YOU]` that the Apple Team ID and Android signing SHA-256 must be
   filled in before universal links verify (human input H4).
5. PLAN.md entry per its conventions; run `npm run verify:local`; PR on `claude/app-api-v1`,
   merge when green. Hostinger auto-deploys `main`: after merge, curl the live routes on
   `realestateinparaguay.com` and confirm JSON + headers; record the live base URL in
   app.propia §9 (this file) via a tiny follow-up commit on app.propia `main`.

Exit: three routes live and returning contract-shaped JSON with `Cache-Control`; verify
script passes; a draft listing returns 404; `npm run verify:local` green; propia.node
PLAN.md and app.propia §9 both updated.

## §6 Sonnet phases

Hard limits (§4.7): no shape changes to types/contract/client transport, no `app.json`
identifier changes, no propia.node changes. Data only via `getListings`/`getListing`/`getMeta`.

### §6.1 S4 — Real data and the UX the data needs (app.propia)

1. Point `.env.example` and the default `EXPO_PUBLIC_API_BASE` at the live base recorded in
   §9; run the app with `EXPO_PUBLIC_USE_MOCK=false` against real listings.
2. `app/index.tsx`: `useInfiniteQuery` + `onEndReached` (REVIEW F8), pull-to-refresh, error
   state with retry button, skeleton/loading rows, count header from `total`.
3. Prices everywhere through `formatPrice` (PYG rentals show `₲ … /mes`).
4. Detail: paged horizontal gallery over `images[]` with `expo-image` (`contentFit="cover"`,
   `cachePolicy="disk"`), image counter, amenities chips, "Publicado" date, agent/agency block
   with verified badge.
5. Filters: chips from `src/lib/labels.ts`; add price range (min/max USD presets), bedrooms
   (1+/2+/3+/4+), city + barrio pickers fed by `getMeta()`. Filter state in the URL
   (`useLocalSearchParams`) so back/forward and deep links keep it.
6. `+not-found.tsx` copy, empty states, `StatusBar` verified in dark mode, cards use
   `thumbUrl`.

Exit: CI green; on a device against real data: scroll loads ≥2 pages, a PYG rental shows
guaraníes with `/mes`, a listing with 3+ images swipes through them, city filter narrows
the count to match the same filter on the website, a `/propiedad/...` deep link opens the
right listing; screenshots of list/detail/filters attached to the PR.

### §6.2 S5 — Store readiness and docs (app.propia)

1. Real icon/splash/adaptive icon in brand colours from `src/config/brand.ts` (design them in
   code with a small script or hand-made PNGs; no Higgsfield credits needed).
2. `eas.json` with `development`, `preview`, `production` profiles; `production` sets
   `EXPO_PUBLIC_USE_MOCK=false` and fails the build if it is anything else (guard script in
   `package.json` `prebuild` hook). `app.json` gets `extra.eas.projectId` only if H1 is
   provided; otherwise document the exact `eas init` step.
3. `README.md`, `ARCHITECTURE.md`: rewrite to reality — brand/domain, live API, dev loop on the
   current SDK (Expo Go or dev build), CI, how to run against mock vs live, deep links, store
   steps. Delete stale "propia.com.py är inte lanserad" and incident prose. Keep Swedish.
4. `KNOWN-ISSUES.md` triaged; `fable/plan.md` §9 closing entry; §10 Backlog kept.
5. If H1–H3 exist: `eas build --profile preview` for both platforms and submit to TestFlight /
   Play internal testing; else stop at "ready to build" with the numbered manual steps.

Exit: CI green; `npx expo prebuild --no-install` clean; docs describe the repo as it is;
closing report (§4.9 STOP footer in the prompt) posted.

## §7 Human-inputs checklist

| id | input | first needed |
|---|---|---|
| H0 | Brand/domain answer (REVIEW Q1); default is the recommended one | O2 (uses default if silent) |
| H1 | Expo/EAS account + `eas init` project id | S5 |
| H2 | Apple Developer account (Team ID) | S5 build; O3 AASA template needs the Team ID to go live |
| H3 | Google Play Console account + upload key SHA-256 | S5 build; O3 assetlinks template |
| H4 | Fill `TEAMID`/SHA-256 into propia.node `.well-known` files | after O3, before universal links work |
| H5 | `R2_PUBLIC_BASE_URL` set on the live propia.node deploy (already a propia.node `[YOU]` item) | O3 live check — until then image URLs are the picsum source URLs, which still render |

## §8 Open business questions (parked)

- Q1 brand/domain — see REVIEW §4.1; plan proceeds on the recommended answer.
- Should the app ship before the D6 flip makes `inmobiliaria.com.py` the Spanish primary?
  Not a build question; API answers on both hosts.
- App Store category/copy/screenshots language — S5 drafts Spanish, Anton approves.

## §9 Build log & handoff

- 2026-09-02 — Fable review session. `9320775` adds `expo-asset` (REVIEW F3). This plan
  and `fable/REVIEW.md` written. Next phase: O1. Nothing else changed.

## §10 Backlog

- Map view (`react-native-maps` or MapLibre RN) reusing propia.node `/api/mapa` bbox feed.
- Favourites (local `AsyncStorage` first, account-backed later).
- Push for saved searches (the app's main differentiator per ARCHITECTURE.md §6) — needs
  accounts and a server-side job in propia.node.
- Accounts via propia.node's OTP flow exposed as `/api/v1/auth/*`.
- English UI when an EN door (`realestateinparaguay.com` post-flip) exists; contract already
  carries `titleEn/descriptionEn`.
- Similar listings on detail (`getSimilarListings` exists in propia.node).
- Financing/cuota calculator screen mirroring the web (`getBestFinancingProgram`).
- Rename the GitHub repo once the brand is final.
