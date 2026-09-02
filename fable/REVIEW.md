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

## 5. Fixed in this session

- `9320775` — declare `expo-asset ~11.0.5` as a direct dependency so Metro can start on a fresh clone (F3). Verified with `npm run typecheck` and `npx expo export --platform ios` (bundle produced).

Not fixed, by design: everything else is in `fable/plan.md`.
