import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { relations, users } from '../schema.js';
import type { UpdateUserDtoType } from './users.dto.js';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
type Db = NodePgDatabase<typeof relations>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(@InjectDrizzle() private readonly db: Db) {}

  async findAll(): Promise<any[]> {
    this.logger.log('findAll users');
    return this.db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, city: users.city, address: users.address, role: users.role }).from(users);
  }

  async findOne(id: number): Promise<any> {
    this.logger.log(`findOne user: id=${id}`);
    const rows = await this.db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, city: users.city, address: users.address, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException();
    return rows[0];
  }

  async update(id: number, data: UpdateUserDtoType): Promise<void> {
    this.logger.log(`update user: id=${id}`);
    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.city !== undefined) patch.city = data.city;
    if (data.address !== undefined) patch.address = data.address;
    if (data.role !== undefined) patch.role = data.role;
    const res = await this.db.update(users).set(patch).where(eq(users.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
    this.logger.log('update user: done');
  }

  async updateRole(id: number, role: 'user' | 'admin'): Promise<void> {
    this.logger.log(`updateRole user: id=${id} role=${role}`);
    const res = await this.db.update(users).set({ role }).where(eq(users.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
    this.logger.log('updateRole: done');
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`remove user: id=${id}`);
    const res = await this.db.delete(users).where(eq(users.id, id)).returning();
    if (!res[0]) throw new NotFoundException();
    this.logger.log('remove user: done');
  }
}