import { Module } from '@nestjs/common';
import {
  DynamicConfigModule,
  LoggerModule,
  drizzleConfiguration,
  drizzleSchema,
  DrizzleModule,
  RmqGolevelupModule,
  rmqGolevelupConfiguration,
  rmqGolevelupSchema,
} from '@prowerbdigital/common';
import Joi from 'joi';

import { appConfiguration, appSchema, CDC_EXCHANGE } from './common';
import { UserSnapshotModule } from './modules/user-snapshot/user-snapshot.module';
import { ServicesModule } from './modules/services/services.module';

@Module({
  imports: [
    DynamicConfigModule.register({
      app: 'worker',
      opts: {
        validationSchema: Joi.object({ ...appSchema, ...drizzleSchema, ...rmqGolevelupSchema }),
        load: [appConfiguration, drizzleConfiguration, rmqGolevelupConfiguration],
      },
    }),
    LoggerModule.forRoot({ service: 'module-demo-widget-worker' }),
    DrizzleModule.forRoot({}),
    RmqGolevelupModule.forRoot({
      exchanges: [{ name: CDC_EXCHANGE, type: 'topic', options: { durable: true } }],
    }),
    ServicesModule,
    UserSnapshotModule,
  ],
})
export class WorkerModule {}
