import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq, inArray } from 'drizzle-orm';
import { carts, products } from '../schema.js';
import type { CreateOrderDtoType } from './orders.dto.js';

type Db = any;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(@InjectDrizzle() private readonly db: Db) {}

  async create(data: CreateOrderDtoType): Promise<void> {
    this.logger.log('create order');
    const ids: number[] = (data.productsIds ?? []).map(Number);
    let total = 0;
    if (ids.length) {
      const rows = await this.db.select().from(products).where(inArray(products.id, ids));
      total = rows.reduce((s: number, r: any) => s + Number(r.price), 0);
    }
    await this.db.insert(carts).values({
      productsIds: ids,
      totalPrice: String(total),
      status: data.status ?? 'active',
      userId: Number(data.userId),
    });
    this.logger.log('create order: done');
  }

  async findAll(): Promise<any[]> {
    this.logger.log('findAll orders');
    return this.db.select().from(carts);
  }

  async findOne(id: number): Promise<any> {
    this.logger.log(`findOne order: id=${id}`);
    const rows = await this.db.select().from(carts).where(eq(carts.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    return rows[0];
  }

  async updateStatus(id: number, status: string): Promise<void> {
    this.logger.log(`updateStatus order: id=${id} status=${status}`);
    const res = await this.db.update(carts).set({ status }).where(eq(carts.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
  }

  async markReceived(id: number): Promise<void> {
    this.logger.log(`markReceived order: id=${id}`);
    await this.updateStatus(id, 'completed');
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`remove order: id=${id}`);
    const res = await this.db.delete(carts).where(eq(carts.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
  }
}