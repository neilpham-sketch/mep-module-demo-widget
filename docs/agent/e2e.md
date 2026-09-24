# Running End-to-End Tests for Demo Widget

This repo ships a Playwright suite at `e2e/`, covering the backend API only for now —
`packages/ui` has no standalone runnable app yet (see the root `README.md`'s
"packages/ui has no login, middleware, or layout of its own" section), so there is a
second, deliberately-skipped test file documenting that gap rather than silence.

## Running it

```bash
pnpm start:dev           # in one terminal — apps/internal must be running (api.spec.ts only covers it, not apps/external, for now)
pnpm e2e                 # in another — runs everything under e2e/tests/
```

`pnpm e2e` runs the whole `e2e/tests/` directory — both `api.spec.ts` (the real suite) and
`ui.spec.ts` (the fixme'd placeholder below), not just `api.spec.ts` alone.

`e2e/tests/api.spec.ts` checks the health endpoint and the example endpoint respond —
the thing most likely to silently break when a route or the Kong reservation changes.

`e2e/tests/ui.spec.ts` is marked `test.fixme()` — it exists so the gap is visible when
listing tests, not invisible. The `playwright` binary and its config live under `e2e/`, not
the repo root, so list tests with
`pnpm --filter @prowerbdigital/module-demo-widget-e2e exec playwright test --list`
(or `cd e2e && npx playwright test --list`). Do not delete this placeholder; if the
local-preview harness for `packages/ui` gets built later, turn this into a real test instead.
