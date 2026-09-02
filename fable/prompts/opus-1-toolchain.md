# Phase O1 — Toolchain current and gated. Paste into a fresh OPUS session (auto-accept permissions).

Read `fable/REVIEW.md` and `fable/plan.md` FIRST, in full — plus plan §9 build log and
`KNOWN-ISSUES.md` if it exists. Execute plan §5.1 under the autonomy protocol §4. Build
nothing outside the plan.

Phase rules:
- Branch `phase/o1` off latest `main` (`git fetch origin main` first).
- Skills to load: `nodejs-mysql-hostinger-stack` is NOT relevant here; none required.
- Upgrade to the CURRENT stable Expo SDK (check `npm view expo version`), not an intermediate
  one. Fix every breaking change properly; no `// @ts-ignore`, no `--legacy-peer-deps`.
- Do NOT touch any identifier or string containing `propia` — that is phase O2.
- CI must be offline-safe: `EXPO_OFFLINE=1` on export, no EAS, no secrets.
- Re-runnable; minor issues → `KNOWN-ISSUES.md`; stop only per §4.4.

Exit (all must hold):
- `npm ci && npm run typecheck && npm run lint` pass locally with zero warnings.
- `EXPO_OFFLINE=1 npx expo export --platform ios` and `--platform android` produce bundles.
- `npx expo prebuild --no-install` succeeds (placeholder assets present).
- `.github/workflows/ci.yml` ran green on the PR with all four steps.
- App renders list → detail → WhatsApp button on `npx expo start --web` or a simulator.
- PR merged into `main`; plan §9 entry committed.

## After this phase — hand off to the next (fresh session)
Only when all four gates pass (PR merged green; exit list above; pre-handoff audit: re-run
typecheck/lint/export and adversarially re-read your merged diff; §9 entry on `main`): call
claude-code-remote `create_session` with `model` = Opus (never Fable), inherit environment
and permission mode (never `plan`), `prompt` exactly:
`Read fable/prompts/opus-2-contract-identity.md in this repo and execute it.`
Fallback without `create_session`: continue in this window (same model). Never hand off
with a red PR or an unmet exit item. End with a short phase report.
