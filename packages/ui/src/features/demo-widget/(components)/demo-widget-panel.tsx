'use client';

import type { AxiosInstance } from 'axios';

import { useDemoWidgetPing } from '../(hooks)/use-demo-widget-ping';

export interface DemoWidgetPanelProps {
  apiClient: AxiosInstance;
}

/**
 * Host mount point for Demo Widget. mep-dashboard-fe renders this inside its own
 * [locale]/(private) route/layout — this package supplies no route file, layout, or
 * providers of its own (docs/ADR-0011).
 */
export function DemoWidgetPanel({ apiClient }: DemoWidgetPanelProps) {
  const { data, isLoading } = useDemoWidgetPing(apiClient);

  if (isLoading) {
    return <p>Loading Demo Widget…</p>;
  }

  return (
    <div>
      <h1>Demo Widget</h1>
      <p>Module key: {data?.module}</p>
    </div>
  );
}
