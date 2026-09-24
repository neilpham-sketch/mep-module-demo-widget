import { useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';

import { pingDemoWidget } from '../(services)/demo-widget.service';

export function useDemoWidgetPing(client: AxiosInstance) {
  return useQuery({
    queryKey: ['module', 'demo-widget', 'ping'],
    queryFn: () => pingDemoWidget(client),
  });
}
