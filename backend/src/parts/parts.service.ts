import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { laptopParts } from '../schema.js';
import type { CreatePartDtoType, UpdatePartDtoType } from './parts.dto.js';

type Db = any;

@Injectable()
export class PartsService {
  private readonly logger = new Logger(PartsService.name);
  constructor(@InjectDrizzle() private readonly db: Db) {}

  async create(data: CreatePartDtoType): Promise<void> {
    this.logger.log('create part');
    await this.db.insert(laptopParts).values({ name: data.name, type: data.type, price: String(data.price) });
    this.logger.log('create part: done');
  }

  async findAll(): Promise<any[]> {
    this.logger.log('findAll parts');
    return this.db.select().from(laptopParts);
  }

  async findOne(id: number): Promise<any> {
    this.logger.log(`findOne part: id=${id}`);
    const rows = await this.db.select().from(laptopParts).where(eq(laptopParts.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    return rows[0];
  }

  async update(id: number, data: UpdatePartDtoType): Promise<void> {
    this.logger.log(`update part: id=${id}`);
    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.type !== undefined) patch.type = data.type;
    if (data.price !== undefined) patch.price = String(data.price);
    const res = await this.db.update(laptopParts).set(patch).where(eq(laptopParts.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
    this.logger.log('update part: done');
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`remove part: id=${id}`);
    const res = await this.db.delete(laptopParts).where(eq(laptopParts.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
    this.logger.log('remove part: done');
  }
}