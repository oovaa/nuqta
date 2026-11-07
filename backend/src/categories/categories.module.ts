import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';
import { CacheService } from '../common/cache.service.js';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CacheService],
})
export class CategoriesModule {}