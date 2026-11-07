import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard.js';
import { AdminGuard } from '../common/admin.guard.js';
import { UsersService } from './users.service.js';
import { UpdateUserDto, UpdateUserRoleDto } from './users.dto.js';
import type { UpdateUserDtoType, UpdateUserRoleDtoType } from './users.dto.js';
import { z } from 'zod';

@Controller('users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  logger = new Logger(UsersService.name);

  @Get()
  async findAll(): Promise<{ users: any[] }> {
    this.logger.log('getting all users');
    const rows = await this.svc.findAll();
    this.logger.log(`they are: ${rows.length} users`);
    return { users: rows };
  }

  @Get(':id')
  async findOne(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
  ): Promise<{ user: any }> {
    const r = await this.svc.findOne(id);
    return { user: r };
  }

  @Patch(':id')
  async update(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
    @Body({ schema: UpdateUserDto }) body: UpdateUserDtoType,
  ): Promise<{ status: string }> {
    await this.svc.update(id, body);
    return { status: 'ok' };
  }

  @Delete(':id')
  async remove(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
  ): Promise<{ status: string }> {
    await this.svc.remove(id);
    return { status: 'ok' };
  }

  @Patch('role/:id')
  @UseGuards(AdminGuard)
  async updateRole(
    @Param('id', { schema: z.coerce.number().int() }) id: number,
    @Body({ schema: UpdateUserRoleDto }) body: UpdateUserRoleDtoType,
  ): Promise<{ status: string }> {
    if (!body.role) throw new BadRequestException();
    await this.svc.updateRole(id, body.role);
    return { status: 'ok' };
  }
}
