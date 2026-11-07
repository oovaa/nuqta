import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq, and, ilike } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { relations, products } from '../schema.js';
import { MediaService } from '../media/media.service.js';
import { CacheService } from '../common/cache.service.js';
import type { CreateProductDtoType, UpdateProductDtoType, ProductQueryDtoType } from './products.dto.js';

type Db = NodePgDatabase<typeof relations>;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectDrizzle() private readonly db: Db,
    private readonly media: MediaService,
    private readonly cache: CacheService,
  ) {}

  private toNum(v: any): number | null {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  async create(data: CreateProductDtoType, image?: { buffer: Buffer; originalname?: string }, thumbnail?: { buffer: Buffer; originalname?: string }): Promise<void> {
    this.logger.log('create product');
    let imageUrl: string | null = null;
    let thumbnailImageUrl: string | null = null;
    if (image) imageUrl = await this.media.save(image);
    if (thumbnail) thumbnailImageUrl = await this.media.save(thumbnail);
    await this.db.insert(products).values({
      name: data.name,
      price: String(data.price),
      description: data.description ?? null,
      categoryId: this.toNum(data.categoryId),
      year: this.toNum(data.year),
      color: data.color ?? null,
      ram: data.ram ?? null,
      rom: data.rom ?? null,
      tag: data.tag ?? null,
      company: data.company ?? null,
      imageUrl,
      thumbnailImageUrl,
    });
    this.cache.clearPrefix('products:');
    this.logger.log('create product: done');
  }

  async findAll(filters?: ProductQueryDtoType): Promise<any[]> {
    this.logger.log('findAll products');
    const conds: any[] = [];
    if (filters?.categoryId !== undefined && filters?.categoryId !== null) {
      conds.push(eq(products.categoryId, Number(filters.categoryId)));
    }
    if (filters?.name) {
      conds.push(ilike(products.name, `%${filters.name}%`));
    }
    if (conds.length) {
      return this.db.select().from(products).where(and(...conds));
    }
    const cached = this.cache.get<any[]>('products:all');
    if (cached) return cached;
    const rows = await this.db.select().from(products);
    this.cache.set('products:all', rows, 30000);
    return rows;
  }

  async findOne(id: number): Promise<any> {
    this.logger.log(`findOne product: id=${id}`);
    const rows = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    return rows[0];
  }

  async update(id: number, data: UpdateProductDtoType, image?: { buffer: Buffer; originalname?: string }, thumbnail?: { buffer: Buffer; originalname?: string }): Promise<any> {
    this.logger.log(`update product: id=${id}`);
    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.price !== undefined) patch.price = String(data.price);
    if (data.description !== undefined) patch.description = data.description;
    if (data.categoryId !== undefined) patch.categoryId = this.toNum(data.categoryId);
    if (data.year !== undefined) patch.year = this.toNum(data.year);
    if (data.color !== undefined) patch.color = data.color;
    if (data.ram !== undefined) patch.ram = data.ram;
    if (data.rom !== undefined) patch.rom = data.rom;
    if (data.tag !== undefined) patch.tag = data.tag;
    if (data.company !== undefined) patch.company = data.company;
    if (image) patch.imageUrl = await this.media.save(image);
    if (thumbnail) patch.thumbnailImageUrl = await this.media.save(thumbnail);
    const rows = await this.db.update(products).set(patch).where(eq(products.id, id)).returning();
    if (!rows[0]) throw new NotFoundException();
    this.cache.clearPrefix('products:');
    this.logger.log('update product: done');
    return rows[0];
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`remove product: id=${id}`);
    const res = await this.db.delete(products).where(eq(products.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
    this.cache.clearPrefix('products:');
    this.logger.log('remove product: done');
  }
}