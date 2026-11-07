import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { relations, payments, cashPayments, bankPayments, cardPayments } from '../schema.js';
import type { CreatePaymentDtoType } from './payment.dto.js';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
type Db = NodePgDatabase<typeof relations>;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(@InjectDrizzle() private readonly db: Db) {}

  async create(data: CreatePaymentDtoType): Promise<void> {
    this.logger.log('create payment');
    const rows = await this.db.insert(payments).values({
      userId: Number(data.userId),
      cartId: Number(data.orderId),
      shippingId: Number(data.shippingId),
      amount: String(data.amount),
    }).returning();
    const paymentId = rows[0].id;
    const method = data.method;
    if (method === 'cash') {
      await this.db.insert(cashPayments).values({ paymentId, name: 'cash' });
    } else if (method === 'bank') {
      await this.db.insert(bankPayments).values({ paymentId, name: 'bank', bankAccountNumber: data.bankAccountNumber ?? '' });
    } else if (method === 'card') {
      await this.db.insert(cardPayments).values({ paymentId, name: 'card', cardNumber: data.cardNumber ?? '', cvv: data.cvv ?? '', expiry: data.expiry ?? '' });
    }
    this.logger.log('create payment: done');
  }

  private async detectMethod(id: number): Promise<string> {
    const [cash, bank, card] = await Promise.all([
      this.db.select().from(cashPayments).where(eq(cashPayments.paymentId, id)).limit(1),
      this.db.select().from(bankPayments).where(eq(bankPayments.paymentId, id)).limit(1),
      this.db.select().from(cardPayments).where(eq(cardPayments.paymentId, id)).limit(1),
    ]);
    if (bank[0]) return 'bank';
    if (card[0]) return 'card';
    return 'cash';
  }

  async findAll(): Promise<any[]> {
    this.logger.log('findAll payments');
    const rows = await this.db.select().from(payments);
    const out = [];
    for (const p of rows) {
      out.push({ ...p, method: await this.detectMethod(p.id) });
    }
    return out;
  }

  async findOne(id: number): Promise<any> {
    this.logger.log(`findOne payment: id=${id}`);
    const rows = await this.db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    const p = rows[0];
    return { ...p, method: await this.detectMethod(id) };
  }
}