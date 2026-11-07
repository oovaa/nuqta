import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { relations, categories } from '../schema.js';
import { CacheService } from '../common/cache.service.js';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
type Db = NodePgDatabase<typeof relations>;

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  constructor(@InjectDrizzle() private readonly db: Db, private readonly cache: CacheService) {}

  async create(name: string): Promise<void> {
    this.logger.log(`create: name=${name}`);
    if (!name) throw new Error('missing');
    await this.db.insert(categories).values({ name });
    this.cache.clearPrefix('categories:');
    this.logger.log('create: done');
  }

  async findAll(): Promise<{ id: number; name: string }[]> {
    this.logger.log('findAll');
    const cached = this.cache.get<{ id: number; name: string }[]>('categories:all');
    if (cached) {
      this.logger.log('findAll: cache hit');
      return cached;
    }
    const rows = await this.db.select().from(categories);
    this.cache.set('categories:all', rows, 30000);
    this.logger.log(`findAll: ${rows.length} rows`);
    return rows;
  }

  async findOne(id: number): Promise<{ id: number; name: string }> {
    this.logger.log(`findOne: id=${id}`);
    const rows = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    return rows[0];
  }

  async update(id: number, name: string): Promise<void> {
    this.logger.log(`update: id=${id} name=${name}`);
    const res = await this.db.update(categories).set({ name }).where(eq(categories.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
    this.cache.clearPrefix('categories:');
    this.logger.log('update: done');
  }

  async removeByIdOrName(key: string): Promise<void> {
    this.logger.log(`remove: key=${key}`);
    const num = Number(key);
    let res;
    if (!Number.isNaN(num)) {
      res = await this.db.delete(categories).where(eq(categories.id, num)).returning();
    } else {
      res = await this.db.delete(categories).where(eq(categories.name, key)).returning();
    }
    if (!res?.[0]) throw new NotFoundException();
    this.cache.clearPrefix('categories:');
    this.logger.log('remove: done');
  }
}