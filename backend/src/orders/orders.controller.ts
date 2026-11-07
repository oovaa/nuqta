import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto, UpdateOrderStatusDto } from './orders.dto.js';
import type { CreateOrderDtoType, UpdateOrderStatusDtoType } from './orders.dto.js';
import { z } from 'zod';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);
  constructor(private readonly svc: OrdersService) {}

  @Post()
  async create(@Body({ schema: CreateOrderDto }) body: CreateOrderDtoType): Promise<{ status: string }> {
    this.logger.log('POST /orders');
    await this.svc.create(body);
    return { status: 'ok' };
  }

  @Get()
  async findAll(): Promise<{ orders: any[] }> {
    this.logger.log('GET /orders');
    const rows = await this.svc.findAll();
    return {
      orders: rows.map((r) => ({
        id: r.id,
        productsIds: r.productsIds,
        totalPrice: r.totalPrice,
        created_at: r.createdAt,
        status: r.status,
        userId: r.userId,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<{ order: any }> {
    this.logger.log(`GET /orders/${id}`);
    const r = await this.svc.findOne(id);
    return {
      order: {
        id: r.id,
        productsIds: r.productsIds,
        totalPrice: r.totalPrice,
        created_at: r.createdAt,
        status: r.status,
        userId: r.userId,
      },
    };
  }

  @Patch(':id')
  async update(@Param('id', { schema: z.coerce.number().int() }) id: number, @Body({ schema: UpdateOrderStatusDto }) body: UpdateOrderStatusDtoType): Promise<{ status: string }> {
    this.logger.log(`PATCH /orders/${id}`);
    await this.svc.updateStatus(id, body.status);
    return { status: 'ok' };
  }

  @Post(':id/revicved')
  async received(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<{ status: string }> {
    this.logger.log(`POST /orders/${id}/revicved`);
    await this.svc.markReceived(id);
    return { status: 'ok' };
  }

  @Delete(':id')
  async remove(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<{ status: string }> {
    this.logger.log(`DELETE /orders/${id}`);
    await this.svc.remove(id);
    return { status: 'ok' };
  }
}