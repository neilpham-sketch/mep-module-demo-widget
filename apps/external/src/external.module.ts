import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
  DrizzleModule,
  DynamicConfigModule,
  LoggerModule,
  drizzleConfiguration,
  drizzleSchema,
} from '@prowerbdigital/common';
import Joi from 'joi';

import { appConfiguration, appSchema } from './common';
import { HealthModule } from './modules/health/health.module';

/**
 * Public-facing counterpart to apps/internal (docs/ADR-0001) — same
 * config/logger/drizzle/CQRS wiring, its own port and Kong route
 * (`demo-widget/ext/api`, see main.ts), no business modules yet. Add this
 * module's customer-facing routes here as the module grows, same as `apps/internal`.
 */
@Module({
  imports: [
    DynamicConfigModule.register({
      app: 'external',
      opts: {
        validationSchema: Joi.object({
          ...appSchema,
          ...drizzleSchema,
        }),
        load: [appConfiguration, drizzleConfiguration],
      },
    }),
    LoggerModule.forRoot({ service: 'module-demo-widget-external' }),
    DrizzleModule.forRoot({}),
    CqrsModule.forRoot(),
    HealthModule,
  ],
})
export class ExternalModule {}
