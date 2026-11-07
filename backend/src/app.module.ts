import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { ShippingModule } from './shipping/shipping.module.js';
import { PaymentModule } from './payment/payment.module.js';
import { PartsModule } from './parts/parts.module.js';
import { SoldLaptopsModule } from './sold-laptops/sold-laptops.module.js';
import { MediaModule } from './media/media.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { CartModule } from './cart/cart.module.js';
import { readFileSync } from 'node:fs';
import { relations } from './schema.js';

try {
  const envPath = new URL('../.env', import.meta.url);
  for (const line of readFileSync(envPath, 'utf8').split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
} catch {}

@Module({
  imports: [
    DrizzleModule.forRoot({
      drizzle,
      connection: process.env.DATABASE_URL!,
      relations: relations,
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    ShippingModule,
    PaymentModule,
    PartsModule,
    SoldLaptopsModule,
    MediaModule,
    ReviewsModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
