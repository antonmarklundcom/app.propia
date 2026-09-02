# Phase O2 — Contract, types, identity. Paste into a fresh OPUS session, ONLY after O1 is merged.

Read `fable/REVIEW.md` and `fable/plan.md` FIRST, in full — plus plan §9 and
`KNOWN-ISSUES.md`. Execute plan §5.2 under the autonomy protocol §4. Build nothing outside it.

Phase rules:
- Branch `phase/o2` off latest `main`. O1 unmerged ⇒ finish O1 first.
- Clone `https://github.com/antonmarklundcom/propia.node` read-only (depth 1) and verify
  every field in the contract against its current `src/db/schema.ts`, `src/lib/facets.ts`,
  `src/lib/queries.ts`, `src/lib/format.ts`, `src/config/verticals.ts`. The contract must be
  implementable by reusing those; name the functions in the contract.
- Brand/domain: use plan §1's recommended answer unless plan §9 records Anton's answer.
  Keep every brand value in `app.json`, `.env.example`, `src/config/brand.ts` only.
- Price rule in plan §2 is the money-correctness bar; write `scripts/verify-format.ts` first.
- Sonnet phases may not change what you write here — make types and client complete
  (`getMeta`, pagination passthrough, timeout, `EXPO_PUBLIC_USE_MOCK`) now.
- Re-runnable; minor issues → `KNOWN-ISSUES.md`; stop only per §4.4 (ids are permanent).

Exit (all must hold):
- CI green: typecheck, lint, both exports, `verify-format`.
- `grep -ri propia app src app.json` returns nothing (docs may still mention it until S5).
- Mock mode renders list and detail; a PYG mock rental shows `₲ … /mes`.
- `npx uri-scheme open "<scheme>://propiedad/casa-x-a1b2c3d4e5" --ios` opens the detail.
- `API_CONTRACT.md` says "v1 — final before build" and lists the propia.node functions to reuse.
- PR merged; plan §9 entry committed.

## After this phase — hand off to O3 (fresh session in propia.node)
Four gates as in §4.9 (merged green; exit list; pre-handoff audit; §9 on `main`). Then call
`create_session` with `model` = Opus (never Fable), inherit permission mode (never `plan`),
`source_url` = `https://github.com/antonmarklundcom/propia.node`, `prompt` exactly:
`Clone https://github.com/antonmarklundcom/app.propia read-only, read fable/prompts/opus-3-listings-api.md, fable/plan.md and API_CONTRACT.md there, then execute that phase in THIS repo (propia.node).`
Fallback without `create_session`: stop and report — Anton opens the propia.node session.
