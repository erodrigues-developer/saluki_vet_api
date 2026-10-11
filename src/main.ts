import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { NewrelicInterceptor } from './modules/utils/interceptors/newrelic.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import { securityConfig } from './security/security.config';
import { httpSecurity } from './security/http-security';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const security = securityConfig();
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use(httpSecurity);
  // Only non-sensitive raster branding/product assets remain public.
  for (const folder of ['clinic-settings', 'products']) app.use(`/uploads/${folder}`, (req, res, next) => {
    if (!/\.(png|jpg|jpeg|gif|webp)$/i.test(req.path)) return res.sendStatus(404);
    next();
  }, express.static(join(process.cwd(), 'uploads', folder)));
  app.use('/uploads', (_req, res) => res.sendStatus(404));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalInterceptors(new NewrelicInterceptor());

  app.setGlobalPrefix('api', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: '/', method: RequestMethod.GET },
      { path: 'health/(.*)', method: RequestMethod.GET },
      { path: 'docs', method: RequestMethod.GET },
      { path: 'docs/json', method: RequestMethod.GET },
      { path: 'docs/', method: RequestMethod.GET },
      { path: 'docs/(.*)', method: RequestMethod.ALL },
    ],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  if (!security.production && process.env.SWAGGER_ENABLED === 'true') {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sigma Vet API')
    .setDescription(
      'API de gestão de clientes, pets e agendamentos para a clínica veterinária. Todos os exemplos estão prontos para copiar/colar.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    useGlobalPrefix: false,
    swaggerOptions: {
      persistAuthorization: false,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  }
  app.enableCors({ origin: security.origins, credentials: true, methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Sigmavet-Request'] });

  await app.listen(3000);
}
bootstrap();
