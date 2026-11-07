import { Module } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { MediaModule } from '../media/media.module.js';
import { CacheService } from '../common/cache.service.js';

@Module({
  imports: [MediaModule],
  controllers: [ProductsController],
  providers: [ProductsService, CacheService],
})
export class ProductsModule {}