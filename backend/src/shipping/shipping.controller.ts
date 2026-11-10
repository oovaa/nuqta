import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard.js';
import { ShippingService } from './shipping.service.js';
import { CreateShippingDto, UpdateShippingDto } from './shipping.dto.js';
import type { CreateShippingDtoType, UpdateShippingDtoType } from './shipping.dto.js';
import { z } from 'zod';

@Controller('shipping')
@UseGuards(AuthGuard)
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);
  constructor(private readonly svc: ShippingService) {}

  @Post()
  async create(
    @Body({ schema: CreateShippingDto }) body: CreateShippingDtoType,
  ): Promise<{ status: string }> {
    this.logger.log('POST /shipping');
    await this.svc.create(body);
    return { status: 'ok' };
  }

  @Get()
  async findAll(): Promise<{ shippings: any[] }> {
    this.logger.log('GET /shipping');
    const rows = await this.svc.findAll();
    return { shippings: rows };
  }

  @Get(':id')
  async findOne(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
  ): Promise<{ shipping: any }> {
    this.logger.log(`GET /shipping/${id}`);
    const r = await this.svc.findOne(id);
    return {
      shipping: {
        id: r.id,
        orderId: r.cartId,
        userId: r.userId,
        status: r.status,
        phone: r.phone,
        city: r.city,
        address: r.address,
        price: r.price,
      },
    };
  }

  @Get(':id/status')
  async status(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
  ): Promise<{ status: string }> {
    this.logger.log(`GET /shipping/${id}/status`);
    const s = await this.svc.getStatus(id);
    return { status: s };
  }

  @Patch(':id')
  async update(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
    @Body({ schema: UpdateShippingDto }) body: UpdateShippingDtoType,
  ): Promise<{ status: string }> {
    this.logger.log(`PATCH /shipping/${id}`);
    await this.svc.update(id, body);
    return { status: 'ok' };
  }

  @Delete(':id')
  async remove(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
  ): Promise<{ status: string }> {
    this.logger.log(`DELETE /shipping/${id}`);
    await this.svc.remove(id);
    return { status: 'ok' };
  }
}
