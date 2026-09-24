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
import { ExternalModule } from './external.module';

async function bootstrap() {
  const { nodeEnv, port } = getAppConfig();

  const app = await NestFactory.create<NestExpressApplication>(ExternalModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  const reflector = app.get(Reflector);
  app.useLogger(logger);

  app.enableCors();
  app.enableVersioning({ type: VersioningType.URI });
  // Same Kong route reservation convention as apps/internal (kong/route.yaml, Task 9),
  // under its own /ext segment — mirrors mep-etr/mep-cam's <service>/ext/api pattern.
  app.setGlobalPrefix('demo-widget/ext/api', {
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
      title: 'Demo Widget external API',
      description: 'Demo Widget — MEP SaaS v2 module public-facing API documentation',
      path: 'demo-widget/ext/api/docs',
      bearerAuthName: 'SWAGGER_BEARER_TOKEN',
    });
  }

  await app.listen(port, () => {
    logBootstrapInfo(app, { nodeEnv, logger, appPort: port });
  });
}
bootstrap();
