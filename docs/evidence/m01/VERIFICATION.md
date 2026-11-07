# M01 verification package

**Branch:** `feat/m01-repo-foundation`  
**Status:** Engineering checks green — **merge to `main` requires explicit Owner approval** (not performed).

## Definition of Done checklist

| Criterion | Result |
|---|---|
| Clone → `npm ci` → `npm run dev` loads app | Pass (local) |
| Navigation: Kalender, Kunden, Mitarbeiter, Leistungen, Einstellungen | Pass (Playwright) |
| German UI locale | Pass (`lang="de"`) |
| No fake booking persistence presented as working | Pass (placeholder notices) |
| Lint / typecheck / unit / build / e2e | Pass |
| CI workflow present | `.github/workflows/ci.yml` |
| Screenshots | `docs/evidence/m01/*.png` |

## Commands (re-run 2026-11-07)

```text
npm run lint       → pass
npm run typecheck  → pass
npm run test       → 2 passed
npm run build      → pass
CI=true npm run test:e2e → 7 passed
```

Merge to `main` was **not** executed.

## Owner gate

- [ ] Visual/UX acceptance
- [ ] Approve merge of `feat/m01-repo-foundation` into `main`
- [ ] Confirm proceed to M02/M03/M04

**Note:** Coordination plan approval authorized continuing M02–M04 implementation on feature branches without merging M01 to `main`.
