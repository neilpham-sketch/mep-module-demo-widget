import { Module } from '@nestjs/common';

import { DemoWidgetController } from './controllers';
import { PING_PERMISSION_KEY } from './constants';
import { PingHandler } from './queries';

const QueryHandlers = [PingHandler];

/**
 * Root module for Demo Widget.
 *
 * Shaped like docs/ADR-004's `IModule` contract (key, permissions, migrations) per
 * docs/ADR-0009, even though nothing calls `.register()` on it in this pilot's
 * standalone-service topology — this keeps a cheap migration path open once the
 * platform's dynamic module registry ships.
 */
@Module({
  controllers: [DemoWidgetController],
  providers: [...QueryHandlers],
})
export class DemoWidgetModule {
  static readonly key = 'demo-widget';
  static readonly permissions: { key: string; label: string; type: 'CHECKBOX' }[] = [
    { key: PING_PERMISSION_KEY, label: 'View Demo Widget status', type: 'CHECKBOX' as const },
  ];
  static readonly migrations = './drizzle/migrations';
}
