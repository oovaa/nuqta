import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { soldLaptops } from '../schema.js';
import { MediaService } from '../media/media.service.js';
import type { CreateSoldLaptopDtoType, UpdateSoldLaptopDtoType } from './sold-laptops.dto.js';

type Db = any;

@Injectable()
export class SoldLaptopsService {
  private readonly logger = new Logger(SoldLaptopsService.name);
  constructor(@InjectDrizzle() private readonly db: Db, private readonly media: MediaService) {}

  private n(v: any): number | null {
    if (v === undefined || v === null || v === '') return null;
    const x = Number(v);
    return Number.isNaN(x) ? null : x;
  }

  async create(data: CreateSoldLaptopDtoType, files: { buffer: Buffer; originalname?: string }[] = []): Promise<void> {
    const images = files.length ? await this.media.saveMany(files) : (data.images ?? []);
    await this.db.insert(soldLaptops).values({
      userId: Number(data.userId),
      brand: data.brand,
      model: data.model,
      year: this.n(data.year) ?? 0,
      ram: data.ram ?? '',
      rom: data.rom ?? '',
      romType: data.romType ?? 'ssd',
      size: data.size ?? '',
      cpu: data.cpu ?? '',
      gpu: data.gpu ?? null,
      batteryHealth: this.n(data.batteryHealth),
      chargeCycles: this.n(data.chargeCycles),
      conditionRating: this.n(data.conditionRating) ?? 0,
      images,
      price: String(data.price),
      status: data.status ?? 'pending',
    });
  }

  async findAll(): Promise<any[]> {
    return this.db.select().from(soldLaptops);
  }

  async findOne(id: number): Promise<any> {
    const rows = await this.db.select().from(soldLaptops).where(eq(soldLaptops.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    return rows[0];
  }

  async update(id: number, data: UpdateSoldLaptopDtoType, files: { buffer: Buffer; originalname?: string }[] = []): Promise<void> {
    const patch: any = {};
    if (data.price !== undefined) patch.price = String(data.price);
    if (data.status !== undefined) patch.status = data.status;
    if (data.batteryHealth !== undefined) patch.batteryHealth = this.n(data.batteryHealth);
    if (data.chargeCycles !== undefined) patch.chargeCycles = this.n(data.chargeCycles);
    if (data.conditionRating !== undefined) patch.conditionRating = this.n(data.conditionRating);
    if (files.length) patch.images = await this.media.saveMany(files);
    const res = await this.db.update(soldLaptops).set(patch).where(eq(soldLaptops.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
  }

  async updateStatus(id: number, status: string): Promise<void> {
    const res = await this.db.update(soldLaptops).set({ status }).where(eq(soldLaptops.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
  }

  async remove(id: number): Promise<void> {
    const res = await this.db.delete(soldLaptops).where(eq(soldLaptops.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
  }
}