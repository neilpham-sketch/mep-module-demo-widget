import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { LoggerService, logBootstrapInfo, logShutdownInfo } from '@prowerbdigital/common';

import { getAppConfig } from './common';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const { nodeEnv, port } = getAppConfig();

  const app = await NestFactory.create<NestExpressApplication>(WorkerModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);
  app.enableShutdownHooks();
  app.enableVersioning({ type: VersioningType.URI });

  logShutdownInfo({ app, logger });

  await app.listen(port, () => {
    logBootstrapInfo(app, { nodeEnv, logger, appPort: port });
  });
}

void bootstrap();
