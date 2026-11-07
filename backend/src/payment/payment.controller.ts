import { Body, Controller, Get, Param, Post, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard.js';
import { PaymentService } from './payment.service.js';
import { CreatePaymentDto } from './payment.dto.js';
import type { CreatePaymentDtoType } from './payment.dto.js';
import { z } from 'zod';

@Controller('payment')
@UseGuards(AuthGuard)
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  constructor(private readonly svc: PaymentService) {}

  @Post()
  async create(@Body({ schema: CreatePaymentDto }) body: CreatePaymentDtoType): Promise<{ status: string }> {
    this.logger.log('POST /payment');
    await this.svc.create(body);
    return { status: 'ok' };
  }

  @Get()
  async findAll(): Promise<{ payment: any[] }> {
    this.logger.log('GET /payment');
    const rows = await this.svc.findAll();
    return {
      payment: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        orderId: r.cartId,
        shippingId: r.shippingId,
        amount: r.amount,
        status: r.status,
        method: r.method,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<{ payment: any }> {
    this.logger.log(`GET /payment/${id}`);
    const r = await this.svc.findOne(id);
    return {
      payment: {
        id: r.id,
        userId: r.userId,
        orderId: r.cartId,
        shippingId: r.shippingId,
        amount: r.amount,
        status: r.status,
        method: r.method,
      },
    };
  }
}