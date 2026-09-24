import {
  ClassSerializerInterceptor,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  LoggerService,
  NodeEnv,
  ResponseInterceptor,
  SerializerInterceptor,
  SystemExceptionFilter,
  logBootstrapInfo,
  logShutdownInfo,
  setupSwagger,
} from '@prowerbdigital/common';

import { getAppConfig } from './common';
import { InternalModule } from './internal.module';

async function bootstrap() {
  const { nodeEnv, port } = getAppConfig();

  const app = await NestFactory.create<NestExpressApplication>(InternalModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  const reflector = app.get(Reflector);
  app.useLogger(logger);

  app.enableCors();
  app.enableVersioning({ type: VersioningType.URI });
  // Prefix matches the Kong route reservation exactly (kong/route.yaml, Task 9): Kong's
  // route uses strip_path:false, so it forwards the full incoming path unchanged — this
  // app's own routes must therefore live under /<key>/api, not just /api.
  app.setGlobalPrefix('demo-widget/api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new SerializerInterceptor(reflector),
    new ClassSerializerInterceptor(reflector),
  );
  app.useGlobalFilters(new SystemExceptionFilter(logger));

  logShutdownInfo({ app, logger });

  if (nodeEnv !== NodeEnv.Prod) {
    setupSwagger(app, {
      title: 'Demo Widget API',
      description: 'Demo Widget — MEP SaaS v2 module API documentation',
      path: 'demo-widget/api/docs',
      bearerAuthName: 'SWAGGER_BEARER_TOKEN',
    });
  }

  await app.listen(port, () => {
    logBootstrapInfo(app, { nodeEnv, logger, appPort: port });
  });
}
bootstrap();
