import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard.js';
import { PartsService } from './parts.service.js';
import { CreatePartDto, UpdatePartDto } from './parts.dto.js';
import type { CreatePartDtoType, UpdatePartDtoType } from './parts.dto.js';
import { z } from 'zod';

@Controller('parts')
@UseGuards(AuthGuard)
export class PartsController {
  constructor(private readonly svc: PartsService) {}

  @Post()
  async create(@Body({ schema: CreatePartDto }) body: CreatePartDtoType): Promise<{ status: string }> {
    if (!body.name || !body.type || body.price === undefined) throw new BadRequestException();
    await this.svc.create(body);
    return { status: 'ok' };
  }

  @Get()
  async findAll(): Promise<{ parts: any[] }> {
    const rows = await this.svc.findAll();
    return { parts: rows.map((r) => ({ id: r.id, name: r.name, type: r.type, price: r.price })) };
  }

  @Get(':id')
  async findOne(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<any> {
    const r = await this.svc.findOne(id);
    return { id: r.id, name: r.name, type: r.type, price: r.price };
  }

  @Patch(':id')
  async update(@Param('id', { schema: z.coerce.number().int() }) id: number, @Body({ schema: UpdatePartDto }) body: UpdatePartDtoType): Promise<{ status: string }> {
    await this.svc.update(id, body);
    return { status: 'ok' };
  }

  @Delete(':id')
  async remove(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<{ status: string }> {
    await this.svc.remove(id);
    return { status: 'ok' };
  }
}