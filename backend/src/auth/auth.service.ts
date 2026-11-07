import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as crypto from 'node:crypto';
import { relations, users } from '../schema.js';
import type { RegisterDtoType } from './auth.dto.js';

type Db = NodePgDatabase<typeof relations>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(@InjectDrizzle() private readonly db: Db) {}

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const h = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), h);
  }

  private signToken(payload: { sub: number; role: string }, maxAgeSec: number): string {
    const body = Buffer.from(
      JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSec }),
    ).toString('base64url');
    const sig = crypto
      .createHmac('sha256', process.env.JWT_SECRET ?? 'dev-secret')
      .update(body)
      .digest('base64url');
    return `${body}.${sig}`;
  }

  async register(data: RegisterDtoType): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.log('register');
    if (!data.name || !data.email || !data.password)
      throw new BadRequestException({ error: 'missing attribute' });

    const existing = await this.db.query.users.findFirst({
      where: { email: data.email },
    });
    if (existing) throw new BadRequestException({ error: 'email already exists' });

    const password = this.hashPassword(data.password);
    const rows = await this.db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        password,
        phone: data.phone ?? null,
        city: data.city ?? null,
        address: data.address ?? null,
      })
      .returning();
    const user = rows[0];
    this.logger.log('register: done');
    return {
      accessToken: this.signToken({ sub: user.id, role: user.role }, 15 * 60),
      refreshToken: this.signToken({ sub: user.id, role: user.role }, 7 * 24 * 60 * 60),
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.log('login');
    if (!email || !password) throw new BadRequestException();
    const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user || !this.verifyPassword(password, user.password)) throw new UnauthorizedException();
    this.logger.log('login: success');
    return {
      accessToken: this.signToken({ sub: user.id, role: user.role }, 15 * 60),
      refreshToken: this.signToken({ sub: user.id, role: user.role }, 7 * 24 * 60 * 60),
    };
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.log('refresh');
    const [body, sig] = token.split('.');
    if (!body || !sig) throw new UnauthorizedException();
    const expected = crypto
      .createHmac('sha256', process.env.JWT_SECRET ?? 'dev-secret')
      .update(body)
      .digest('base64url');
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
      throw new UnauthorizedException();
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000)
      throw new UnauthorizedException();
    this.logger.log('refresh: success');
    return {
      accessToken: this.signToken({ sub: payload.sub, role: payload.role }, 15 * 60),
      refreshToken: this.signToken({ sub: payload.sub, role: payload.role }, 7 * 24 * 60 * 60),
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    this.logger.log(`changePassword: userId=${userId}`);
    if (!oldPassword || !newPassword) throw new BadRequestException();
    if (newPassword.length < 6) throw new BadRequestException();
    const rows = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = rows[0];
    if (!user || !this.verifyPassword(oldPassword, user.password))
      throw new UnauthorizedException();
    await this.db
      .update(users)
      .set({ password: this.hashPassword(newPassword) })
      .where(eq(users.id, userId));
    this.logger.log('changePassword: done');
  }

  async resetPassword(email: string, oldPassword: string, newPassword: string): Promise<void> {
    this.logger.log(`resetPassword: email=${email}`);
    const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user) throw new UnauthorizedException();
    await this.changePassword(user.id, oldPassword, newPassword);
  }

  async getMe(userId: number): Promise<any> {
    this.logger.log(`getMe: userId=${userId}`);
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        city: users.city,
        address: users.address,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!rows[0]) throw new UnauthorizedException();
    return rows[0];
  }
}
