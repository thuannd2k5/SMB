import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Handle unhandled rejections gracefully when MongoDB is offline during initial development
  process.on('unhandledRejection', (reason: any) => {
    if (
      reason?.name === 'MongoServerSelectionError' ||
      reason?.name === 'MongooseServerSelectionError' ||
      reason?.name === 'MongoNetworkError'
    ) {
      logger.warn(
        `MongoDB is currently offline or unreachable. Backend is running and will retry automatically.`,
      );
      return;
    }
    logger.error('Unhandled Rejection:', reason);
  });

  const app = await NestFactory.create(AppModule);

  // Increase body size limit for Vision OCR base64 camera image uploads
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  // Enable HTTP Gzip compression for performance optimization
  app.use(compression());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;

  // Global prefix: /api
  app.setGlobalPrefix('api');

  // Enable CORS for frontend Vite dev server (localhost and mobile LAN IP)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global transform interceptor & exception filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port);
  logger.log(`🚀 SMB Smart Inventory Backend running on: http://localhost:${port}/api`);
  logger.log(`🩺 Health check available at: http://localhost:${port}/api/health`);
}

bootstrap();
