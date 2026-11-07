import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseInterceptors, UseGuards, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../common/auth.guard.js';
import { SoldLaptopsService } from './sold-laptops.service.js';
import { CreateSoldLaptopDto, UpdateSoldLaptopDto, UpdateSoldLaptopStatusDto } from './sold-laptops.dto.js';
import type { CreateSoldLaptopDtoType, UpdateSoldLaptopDtoType, UpdateSoldLaptopStatusDtoType } from './sold-laptops.dto.js';
import { z } from 'zod';

@Controller('sold-laptops')
@UseGuards(AuthGuard)
export class SoldLaptopsController {
  constructor(private readonly svc: SoldLaptopsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async create(@Body({ schema: CreateSoldLaptopDto }) body: CreateSoldLaptopDtoType, @UploadedFiles() files?: any[]): Promise<{ status: string }> {
    if (body.userId === undefined || !body.brand || !body.model || body.conditionRating === undefined || body.price === undefined) throw new BadRequestException();
    await this.svc.create(body, files ?? []);
    return { status: 'ok' };
  }

  @Get()
  async findAll(): Promise<{ soldLaptops: any[] }> {
    const rows = await this.svc.findAll();
    return {
      soldLaptops: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        brand: r.brand,
        model: r.model,
        year: r.year,
        ram: r.ram,
        rom: r.rom,
        romType: r.romType,
        size: r.size,
        cpu: r.cpu,
        gpu: r.gpu,
        batteryHealth: r.batteryHealth,
        chargeCycles: r.chargeCycles,
        conditionRating: r.conditionRating,
        images: r.images,
        price: r.price,
        status: r.status,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<any> {
    const r = await this.svc.findOne(id);
    return {
      id: r.id,
      userId: r.userId,
      brand: r.brand,
      model: r.model,
      year: r.year,
      ram: r.ram,
      rom: r.rom,
      romType: r.romType,
      size: r.size,
      cpu: r.cpu,
      gpu: r.gpu,
      batteryHealth: r.batteryHealth,
      chargeCycles: r.chargeCycles,
      conditionRating: r.conditionRating,
      images: r.images,
      price: r.price,
      status: r.status,
    };
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  async update(@Param('id', { schema: z.coerce.number().int() }) id: number, @Body({ schema: UpdateSoldLaptopDto }) body: UpdateSoldLaptopDtoType, @UploadedFiles() files?: any[]): Promise<{ status: string }> {
    await this.svc.update(id, body ?? {}, files ?? []);
    return { status: 'ok' };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id', { schema: z.coerce.number().int() }) id: number, @Body({ schema: UpdateSoldLaptopStatusDto }) body: UpdateSoldLaptopStatusDtoType): Promise<{ status: string }> {
    if (!body.status) throw new BadRequestException();
    await this.svc.updateStatus(id, body.status);
    return { status: 'ok' };
  }

  @Delete(':id')
  async remove(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<{ status: string }> {
    await this.svc.remove(id);
    return { status: 'ok' };
  }
}