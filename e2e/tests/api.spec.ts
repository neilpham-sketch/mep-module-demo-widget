import { test, expect } from '@playwright/test';

/**
 * Regression coverage for this module's own route shape (docs/ADR-0001, ADR-0003,
 * ADR-0004): confirms NestJS's global prefix still matches the path Kong's route
 * reservation expects. This suite runs directly against NestJS — Kong itself is not
 * part of this test's request path. Uses Playwright's `request` fixture (raw HTTP) —
 * no browser binary needed for this suite.
 */
test.describe('Demo Widget API', () => {
  test('GET /v1/health returns 200', async ({ request }) => {
    const response = await request.get('/v1/health');
    expect(response.status()).toBe(200);
  });

  test('GET /v1/ping returns 200 (no permission guard wired up yet)', async ({ request }) => {
    const response = await request.get('/v1/ping');
    expect(response.status()).toBe(200);
  });
});
