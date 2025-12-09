import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { NewrelicInterceptor } from './modules/utils/interceptors/newrelic.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Saluki Vet API')
    .setDescription(
      'API de gestão de clientes, pets e agendamentos para a clínica veterinária. Todos os exemplos estão prontos para copiar/colar.',
    )
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    useGlobalPrefix: false,
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  app.enableCors();

  await app.listen(3000);
}
bootstrap();
