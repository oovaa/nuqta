import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/auth.guard.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto, UpdateCartItemDto } from './cart.dto.js';
import type { AddCartItemDtoType, UpdateCartItemDtoType } from './cart.dto.js';
import { z } from 'zod';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  private readonly logger = new Logger(CartController.name);
  constructor(private readonly svc: CartService) {}

  @Get()
  async get(@Req() req: Request): Promise<any> {
    this.logger.log('GET /cart');
    return this.svc.getCart((req as any).user.id);
  }

  @Post('items')
  async addItem(@Req() req: Request, @Body({ schema: AddCartItemDto }) body: AddCartItemDtoType): Promise<any> {
    this.logger.log('POST /cart/items');
    return this.svc.addItem((req as any).user.id, body.productId, body.quantity);
  }

  @Patch('items/:productId')
  async updateItem(@Req() req: Request, @Param('productId', { schema: z.coerce.number().int() }) productId: number, @Body({ schema: UpdateCartItemDto }) body: UpdateCartItemDtoType): Promise<any> {
    this.logger.log(`PATCH /cart/items/${productId}`);
    return this.svc.updateItem((req as any).user.id, productId, body.quantity);
  }

  @Delete('items/:productId')
  async removeItem(@Req() req: Request, @Param('productId', { schema: z.coerce.number().int() }) productId: number): Promise<any> {
    this.logger.log(`DELETE /cart/items/${productId}`);
    return this.svc.removeItem((req as any).user.id, productId);
  }

  @Delete()
  async clear(@Req() req: Request): Promise<any> {
    this.logger.log('DELETE /cart');
    return this.svc.clear((req as any).user.id);
  }

  @Post('checkout')
  async checkout(@Req() req: Request): Promise<any> {
    this.logger.log('POST /cart/checkout');
    return this.svc.checkout((req as any).user.id);
  }
}