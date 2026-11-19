
import { NestFactory } from '@nestjs/core';

import {
  ValidationPipe,
} from '@nestjs/common';

import { AppModule } from './app.module.js';

import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Enable global request validation.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);

  console.log(
    `Application running on http://localhost:${port}`,
  );
}

bootstrap();
