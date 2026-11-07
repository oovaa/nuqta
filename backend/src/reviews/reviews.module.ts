import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { CacheService } from '../common/cache.service.js';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, CacheService],
  exports: [ReviewsService],
})
export class ReviewsModule {}