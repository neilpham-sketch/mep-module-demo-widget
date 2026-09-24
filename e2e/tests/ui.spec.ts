import { test } from '@playwright/test';

/**
 * packages/ui has no standalone runnable app (docs/ADR-0011) — there is no local host page
 * to point a browser at yet, so this suite is a deliberate, visible placeholder rather than
 * silence. Once the ADR-0011 local-preview harness exists, replace this with real
 * page.goto()-driven tests against DemoWidgetPanel.
 */
test.describe('Demo Widget UI', () => {
  test.fixme(
    'DemoWidgetPanel renders and shows the ping result',
    async () => {
      // Intentionally not implemented — see docs/agent/e2e.md and docs/ADR-0011.
    },
  );
});
