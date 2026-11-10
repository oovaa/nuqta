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
import { CategoriesService } from './categories.service.js';
import { z } from 'zod';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';
import type { CreateCategoryDtoType, UpdateCategoryDtoType } from './categories.dto.js';
import { AdminGuard } from '../common/admin.guard.js';

@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);
  constructor(private readonly svc: CategoriesService) {}

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  async create(
    @Body({ schema: CreateCategoryDto }) body: CreateCategoryDtoType,
  ): Promise<{ status: string }> {
    this.logger.log('POST /categories');
    await this.svc.create(body.name);
    return { status: 'ok' };
  }

  @Get()
  async findAll(): Promise<{ categories: { id: number; name: string }[] }> {
    this.logger.log('GET /categories');
    const rows = await this.svc.findAll();
    return { categories: rows.map((r) => ({ id: r.id, name: r.name })) };
  }

  @Get(':id')
  async findOne(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
  ): Promise<{ categories: { name: string }[] }> {
    this.logger.log(`GET /categories/${id}`);
    const row = await this.svc.findOne(id);
    return { categories: [{ name: row.name }] };
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async update(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
    @Body({ schema: UpdateCategoryDto }) body: UpdateCategoryDtoType,
  ): Promise<{ status: string }> {
    this.logger.log(`PATCH /categories/${id}`);
    await this.svc.update(id, body.name);
    return { status: 'ok' };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  async remove(@Param('id') id: string): Promise<{ status: string }> {
    this.logger.log(`DELETE /categories/${id}`);
    await this.svc.removeByIdOrName(id);
    return { status: 'ok' };
  }
}
