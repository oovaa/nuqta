import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq, and } from 'drizzle-orm';
import { relations, reviews, products } from '../schema.js';
import { CacheService } from '../common/cache.service.js';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
type Db = NodePgDatabase<typeof relations>;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);
  constructor(@InjectDrizzle() private readonly db: Db, private readonly cache: CacheService) {}

  async create(data: { userId: number; productId: number; review: string; rating?: number | null }): Promise<any> {
    this.logger.log('create review');
    if (!data.review) throw new BadRequestException();
    if (data.rating !== undefined && data.rating !== null && (data.rating < 1 || data.rating > 5)) throw new BadRequestException();
    const existing = await this.db.select().from(reviews).where(and(eq(reviews.userId, Number(data.userId)), eq(reviews.productId, Number(data.productId)))).limit(1);
    if (existing[0]) {
      const rows = await this.db.update(reviews).set({
        review: data.review,
        rating: data.rating ?? existing[0].rating,
      }).where(eq(reviews.id, existing[0].id)).returning();
      await this.recalcRating(Number(data.productId));
      this.logger.log('create review: updated existing');
      return rows[0];
    }
    const rows = await this.db.insert(reviews).values({
      userId: Number(data.userId),
      productId: Number(data.productId),
      review: data.review,
      rating: data.rating ?? null,
    }).returning();
    await this.recalcRating(Number(data.productId));
    this.logger.log('create review: done');
    return rows[0];
  }

  async findAll(): Promise<any[]> {
    this.logger.log('findAll reviews');
    return this.db.select().from(reviews);
  }

  async findOne(id: number): Promise<any> {
    this.logger.log(`findOne review: id=${id}`);
    const rows = await this.db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    return rows[0];
  }

  async findByProduct(productId: number): Promise<any[]> {
    this.logger.log(`findByProduct review: productId=${productId}`);
    return this.db.select().from(reviews).where(eq(reviews.productId, productId));
  }

  async update(id: number, data: { review?: string; rating?: number | null }): Promise<any> {
    this.logger.log(`update review: id=${id}`);
    const existing = await this.findOne(id);
    const patch: any = {};
    if (data.review !== undefined) patch.review = data.review;
    if (data.rating !== undefined) {
      if (data.rating !== null && (data.rating < 1 || data.rating > 5)) throw new BadRequestException();
      patch.rating = data.rating;
    }
    const rows = await this.db.update(reviews).set(patch).where(eq(reviews.id, id)).returning();
    if (!rows[0]) throw new NotFoundException();
    await this.recalcRating(existing.productId);
    this.logger.log('update review: done');
    return rows[0];
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`remove review: id=${id}`);
    const existing = await this.findOne(id);
    const res = await this.db.delete(reviews).where(eq(reviews.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
    await this.recalcRating(existing.productId);
    this.logger.log('remove review: done');
  }

  private async recalcRating(productId: number): Promise<void> {
    const rows = await this.db.select().from(reviews).where(eq(reviews.productId, productId));
    const ratings = rows.map((r: any) => r.rating).filter((r: any) => typeof r === 'number');
    const avg = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : '0.0';
    await this.db.update(products).set({ avgRating: avg, ratingCount: rows.length }).where(eq(products.id, productId));
    this.cache.clearPrefix('products:');
  }
}