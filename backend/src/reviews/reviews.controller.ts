import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/auth.guard.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto, UpdateReviewDto } from './reviews.dto.js';
import type { CreateReviewDtoType, UpdateReviewDtoType } from './reviews.dto.js';
import { z } from 'zod';

@Controller('reviews')
@UseGuards(AuthGuard)
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name);
  constructor(private readonly svc: ReviewsService) {}

  @Post()
  async create(@Req() req: Request, @Body({ schema: CreateReviewDto }) body: CreateReviewDtoType): Promise<{ status: string }> {
    this.logger.log('POST /reviews');
    await this.svc.create({
      userId: (req as any).user.id,
      productId: body.productId,
      review: body.review,
      rating: body.rating ?? null,
    });
    return { status: 'ok' };
  }

  @Get()
  async findAll(): Promise<{ reviews: any[] }> {
    this.logger.log('GET /reviews');
    const rows = await this.svc.findAll();
    return { reviews: rows };
  }

  @Get('product/:productId')
  async findByProduct(@Param('productId', { schema: z.coerce.number().int() }) productId: number): Promise<{ reviews: any[] }> {
    this.logger.log(`GET /reviews/product/${productId}`);
    const rows = await this.svc.findByProduct(productId);
    return { reviews: rows };
  }

  @Get(':id')
  async findOne(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<{ review: any }> {
    this.logger.log(`GET /reviews/${id}`);
    const r = await this.svc.findOne(id);
    return { review: r };
  }

  @Patch(':id')
  async update(@Param('id', { schema: z.coerce.number().int() }) id: number, @Body({ schema: UpdateReviewDto }) body: UpdateReviewDtoType): Promise<{ status: string }> {
    this.logger.log(`PATCH /reviews/${id}`);
    await this.svc.update(id, {
      review: body.review,
      rating: body.rating === undefined ? undefined : body.rating,
    });
    return { status: 'ok' };
  }

  @Delete(':id')
  async remove(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<{ status: string }> {
    this.logger.log(`DELETE /reviews/${id}`);
    await this.svc.remove(id);
    return { status: 'ok' };
  }
}