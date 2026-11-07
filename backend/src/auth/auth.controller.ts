import { Body, Controller, Get, Post, Req, Res, UseGuards, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { type AuthedRequest, AuthGuard } from '../common/auth.guard.js';
import { RegisterDto, LoginDto, ChangePasswordDto, ResetPasswordDto } from './auth.dto.js';
import type {
  RegisterDtoType,
  LoginDtoType,
  ChangePasswordDtoType,
  ResetPasswordDtoType,
} from './auth.dto.js';
import { HttpAdapterHost } from '@nestjs/core';
import { AdminGuard } from '../common/admin.guard.js';

function setCookies(res: Response, access: string, refresh: string): void {
  res.setHeader('Set-Cookie', [
    `access_token=${encodeURIComponent(access)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${15 * 60}`,
    `refresh_token=${encodeURIComponent(refresh)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
  ]);
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly auth: AuthService,
    private readonly adabterhttp: HttpAdapterHost,
  ) {}

  @Post('login')
  async login(@Body({ schema: LoginDto }) body: LoginDtoType, @Res() res: Response): Promise<void> {
    this.logger.log('POST /auth/login');
    const { accessToken, refreshToken } = await this.auth.login(body.email, body.password);
    setCookies(res, accessToken, refreshToken);
    this.logger.log('login: success');
    res.json({ status: 'ok' });
  }

  @Post('register')
  async register(
    @Body({ schema: RegisterDto }) body: RegisterDtoType,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log('POST /auth/register');
    const { accessToken, refreshToken } = await this.auth.register(body);
    setCookies(res, accessToken, refreshToken);
    this.logger.log('register: success');
    res.json({ status: 'ok' });
  }

  @Get('refresh')
  async refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    this.logger.log('GET /auth/refresh');
    const cookies = (req as any).cookies ?? {};
    const { accessToken, refreshToken } = await this.auth.refresh(cookies.refresh_token ?? '');
    setCookies(res, accessToken, refreshToken);
    this.logger.log('refresh: success');
    res.json({ status: 'ok' });
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Req() req: AuthedRequest,
    @Body({ schema: ChangePasswordDto }) body: ChangePasswordDtoType,
  ): Promise<{ status: string }> {
    this.logger.log('POST /auth/change-password');
    await this.auth.changePassword(+req.user.id, body.oldPassword, body.newPassword);
    this.logger.log('change-password: success');
    return { status: 'ok' };
  }

  @Post('reset-password')
  @UseGuards(AuthGuard, AdminGuard)
  async resetPassword(
    @Body({ schema: ResetPasswordDto }) body: ResetPasswordDtoType,
  ): Promise<{ status: string }> {
    this.logger.log('POST /auth/reset-password');
    await this.auth.resetPassword(body.email, body.oldPassword, body.newPassword);
    this.logger.log('reset-password: success');
    return { status: 'ok' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: Request): Promise<{ user: any }> {
    this.logger.log('GET /auth/me');
    const user = await this.auth.getMe((req as any).user.id);
    this.logger.log('me: success');
    return { user };
  }

  @Post('logout')
  async logout(@Res() res: Response): Promise<void> {
    this.logger.log('POST /auth/logout');
    this.adabterhttp.httpAdapter.clearCookie(res, 'access_token');
    this.adabterhttp.httpAdapter.clearCookie(res, 'refresh_token');
    this.logger.log('logout: success');
    res.json({ status: 'ok' });
  }
}
