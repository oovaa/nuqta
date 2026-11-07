import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { relations, shippings } from '../schema.js';
import type { CreateShippingDtoType, UpdateShippingDtoType } from './shipping.dto.js';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
type Db = NodePgDatabase<typeof relations>;

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  constructor(@InjectDrizzle() private readonly db: Db) {}

  async create(data: CreateShippingDtoType): Promise<void> {
    this.logger.log('create shipping');
    await this.db.insert(shippings).values({
      cartId: Number(data.orderId),
      userId: Number(data.userId),
      phone: data.phone,
      city: data.city,
      address: data.address,
      price: String(data.price),
    });
    this.logger.log('create shipping: done');
  }

  async findAll(): Promise<any[]> {
    this.logger.log('findAll shipping');
    return this.db.select().from(shippings);
  }

  async findOne(id: number): Promise<any> {
    this.logger.log(`findOne shipping: id=${id}`);
    const rows = await this.db.select().from(shippings).where(eq(shippings.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    return rows[0];
  }

  async getStatus(id: number): Promise<string> {
    this.logger.log(`getStatus shipping: id=${id}`);
    const r = await this.findOne(id);
    return r.status;
  }

  async update(id: number, data: UpdateShippingDtoType): Promise<void> {
    this.logger.log(`update shipping: id=${id}`);
    const patch: any = {};
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.city !== undefined) patch.city = data.city;
    if (data.address !== undefined) patch.address = data.address;
    if (data.status !== undefined) patch.status = data.status;
    const res = await this.db.update(shippings).set(patch).where(eq(shippings.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
    this.logger.log('update shipping: done');
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`remove shipping: id=${id}`);
    const res = await this.db.delete(shippings).where(eq(shippings.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
  }
}