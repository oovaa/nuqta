import { NestFactory } from '@nestjs/core';
import { readFileSync } from 'node:fs';
import cookieParser from 'cookie-parser';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
} catch {
  // ignore
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
