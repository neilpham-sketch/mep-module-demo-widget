import type { AxiosInstance } from 'axios';

/**
 * Calls the module's own backend through whatever axios instance the host
 * (mep-dashboard-fe) already uses for module routes — this package never creates its
 * own axios instance or API base URL (docs/ADR-0011: no duplicated proxy/client setup).
 */
export async function pingDemoWidget(client: AxiosInstance) {
  const { data } = await client.get('/demo-widget/api/v1/ping');
  return data as { module: string; ok: boolean };
}
