import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseInterceptors, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../common/auth.guard.js';
import { ProductsService } from './products.service.js';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './products.dto.js';
import type { CreateProductDtoType, UpdateProductDtoType, ProductQueryDtoType } from './products.dto.js';
import { z } from 'zod';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  constructor(private readonly svc: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]))
  async create(@Body({ schema: CreateProductDto }) body: CreateProductDtoType, @UploadedFiles() files?: any): Promise<{ status: string }> {
    this.logger.log('POST /products');
    const image = files?.image?.[0];
    const thumbnail = files?.thumbnail?.[0];
    await this.svc.create(body, image, thumbnail);
    return { status: 'ok' };
  }

  @Get()
  async findAll(@Query({ schema: ProductQueryDto }) query: ProductQueryDtoType): Promise<{ products: any[] }> {
    this.logger.log('GET /products');
    const rows = await this.svc.findAll(query);
    return {
      products: rows.map((r) => ({
        id: r.id,
        name: r.name,
        price: r.price,
        description: r.description,
        categoryId: r.categoryId,
        year: r.year,
        color: r.color,
        ram: r.ram,
        rom: r.rom,
        tag: r.tag,
        company: r.company,
        imageUrl: r.imageUrl,
        thumbnailImageUrl: r.thumbnailImageUrl,
        avgRating: r.avgRating,
        ratingCount: r.ratingCount,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<any> {
    this.logger.log(`GET /products/${id}`);
    const r = await this.svc.findOne(id);
    return {
      id: r.id,
      name: r.name,
      price: r.price,
      description: r.description,
      categoryId: r.categoryId,
      year: r.year,
      color: r.color,
      ram: r.ram,
      rom: r.rom,
      tag: r.tag,
      company: r.company,
      imageUrl: r.imageUrl,
      thumbnailImageUrl: r.thumbnailImageUrl,
      avgRating: r.avgRating,
      ratingCount: r.ratingCount,
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]))
  async update(@Param('id', { schema: z.coerce.number().int() }) id: number, @Body({ schema: UpdateProductDto }) body: UpdateProductDtoType, @UploadedFiles() files?: any): Promise<any> {
    this.logger.log(`PATCH /products/${id}`);
    const image = files?.image?.[0];
    const thumbnail = files?.thumbnail?.[0];
    const r = await this.svc.update(id, body, image, thumbnail);
    return {
      id: r.id,
      name: r.name,
      price: r.price,
      description: r.description,
      categoryId: r.categoryId,
      year: r.year,
      color: r.color,
      ram: r.ram,
      rom: r.rom,
      tag: r.tag,
      company: r.company,
      imageUrl: r.imageUrl,
      thumbnailImageUrl: r.thumbnailImageUrl,
      avgRating: r.avgRating,
      ratingCount: r.ratingCount,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Param('id', { schema: z.coerce.number().int() }) id: number): Promise<{ status: string }> {
    this.logger.log(`DELETE /products/${id}`);
    await this.svc.remove(id);
    return { status: 'ok' };
  }
}