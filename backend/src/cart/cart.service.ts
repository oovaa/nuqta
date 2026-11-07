import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, inArray } from 'drizzle-orm';
import { relations, carts, products } from '../schema.js';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
type Db = NodePgDatabase<typeof relations>;

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  constructor(@InjectDrizzle() private readonly db: Db) {}

  private async getActiveCart(userId: number): Promise<any> {
    const rows = await this.db.select().from(carts).where(and(eq(carts.userId, userId), eq(carts.status, 'active'))).limit(1);
    if (rows[0]) return rows[0];
    const inserted = await this.db.insert(carts).values({
      productsIds: [],
      totalPrice: '0',
      status: 'active',
      userId: Number(userId),
    }).returning();
    return inserted[0];
  }

  private async getProduct(id: number): Promise<any> {
    const rows = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    return rows[0];
  }

  private async recalc(cartId: number, ids: number[]): Promise<void> {
    let total = 0;
    if (ids.length) {
      const rows = await this.db.select().from(products).where(inArray(products.id, ids));
      const priceMap = new Map<number, number>(rows.map((r: any) => [r.id, Number(r.price)]));
      total = ids.reduce((s: number, id: number) => s + (priceMap.get(id) ?? 0), 0);
    }
    await this.db.update(carts).set({ productsIds: ids, totalPrice: String(total) }).where(eq(carts.id, cartId));
  }

  async getCart(userId: number): Promise<any> {
    this.logger.log(`getCart: userId=${userId}`);
    const cart = await this.getActiveCart(userId);
    const ids: number[] = cart.productsIds ?? [];
    const rows = ids.length ? await this.db.select().from(products).where(inArray(products.id, ids)) : [];
    const counts = new Map<number, number>();
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    const items = rows.map((r: any) => ({ ...r, quantity: counts.get(r.id) ?? 0 }));
    return { cart, items };
  }

  async addItem(userId: number, productId: number, quantity = 1): Promise<any> {
    this.logger.log(`addItem: userId=${userId} productId=${productId} qty=${quantity}`);
    if (quantity < 1) throw new BadRequestException();
    await this.getProduct(productId);
    const cart = await this.getActiveCart(userId);
    const ids: number[] = [...(cart.productsIds ?? [])];
    for (let i = 0; i < quantity; i++) ids.push(productId);
    await this.recalc(cart.id, ids);
    return this.getCart(userId);
  }

  async updateItem(userId: number, productId: number, quantity: number): Promise<any> {
    this.logger.log(`updateItem: userId=${userId} productId=${productId} qty=${quantity}`);
    const cart = await this.getActiveCart(userId);
    const ids: number[] = (cart.productsIds ?? []).filter((id: number) => id !== productId);
    if (quantity > 0) {
      for (let i = 0; i < quantity; i++) ids.push(productId);
    }
    await this.recalc(cart.id, ids);
    return this.getCart(userId);
  }

  async removeItem(userId: number, productId: number): Promise<any> {
    this.logger.log(`removeItem: userId=${userId} productId=${productId}`);
    const cart = await this.getActiveCart(userId);
    const ids: number[] = (cart.productsIds ?? []).filter((id: number) => id !== productId);
    await this.recalc(cart.id, ids);
    return this.getCart(userId);
  }

  async clear(userId: number): Promise<any> {
    this.logger.log(`clear cart: userId=${userId}`);
    const cart = await this.getActiveCart(userId);
    await this.recalc(cart.id, []);
    return this.getCart(userId);
  }

  async checkout(userId: number): Promise<any> {
    this.logger.log(`checkout: userId=${userId}`);
    const cart = await this.getActiveCart(userId);
    const ids: number[] = cart.productsIds ?? [];
    if (!ids.length) throw new BadRequestException();
    await this.db.update(carts).set({ status: 'checked_out' }).where(eq(carts.id, cart.id));
    return { status: 'ok', cartId: cart.id };
  }
}