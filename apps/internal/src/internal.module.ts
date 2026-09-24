import { SharedDataModule } from '@app/layer-data';
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
import { DemoWidgetModule } from './modules/demo-widget/demo-widget.module';

@Module({
  imports: [
    DynamicConfigModule.register({
      app: 'internal',
      opts: {
        validationSchema: Joi.object({
          ...appSchema,
          ...drizzleSchema,
        }),
        load: [appConfiguration, drizzleConfiguration],
      },
    }),
    LoggerModule.forRoot({ service: 'module-demo-widget' }),
    DrizzleModule.forRoot({}),
    SharedDataModule,
    CqrsModule.forRoot(),
    HealthModule,
    DemoWidgetModule,
  ],
})
export class InternalModule {}
