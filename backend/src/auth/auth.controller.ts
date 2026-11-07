import { Body, Controller, Get, Post, Req, Res, UseGuards, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../common/auth.guard.js';
import { RegisterDto, LoginDto, ChangePasswordDto, ResetPasswordDto } from './auth.dto.js';
import type {
  RegisterDtoType,
  LoginDtoType,
  ChangePasswordDtoType,
  ResetPasswordDtoType,
} from './auth.dto.js';

function setCookies(res: Response, access: string, refresh: string): void {
  res.setHeader('Set-Cookie', [
    `access_token=${encodeURIComponent(access)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${15 * 60}`,
    `refresh_token=${encodeURIComponent(refresh)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
  ]);
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body({ schema: LoginDto }) body: LoginDtoType, @Res() res: Response): Promise<void> {
    this.logger.log('POST /auth/login');
    const { accessToken, refreshToken } = await this.auth.login(body.email, body.password);
    setCookies(res, accessToken, refreshToken);
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
    res.json({ status: 'ok' });
  }

  @Get('refresh')
  async refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    const cookies: Record<string, string> = {};
    const header = req.headers.cookie;
    if (header)
      for (const part of header.split(';')) {
        const [k, v] = part.trim().split('=');
        if (k) cookies[k] = decodeURIComponent(v ?? '');
      }
    const { accessToken, refreshToken } = await this.auth.refresh(cookies.refresh_token ?? '');
    setCookies(res, accessToken, refreshToken);
    res.json({ status: 'ok' });
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Req() req: Request,
    @Body({ schema: ChangePasswordDto }) body: ChangePasswordDtoType,
  ): Promise<{ status: string }> {
    this.logger.log('POST /auth/change-password');
    await this.auth.changePassword((req as any).user.id, body.oldPassword, body.newPassword);
    return { status: 'ok' };
  }

  @Post('reset-password')
  async resetPassword(
    @Body({ schema: ResetPasswordDto }) body: ResetPasswordDtoType,
  ): Promise<{ status: string }> {
    this.logger.log('POST /auth/reset-password');
    await this.auth.resetPassword(body.email, body.oldPassword, body.newPassword);
    return { status: 'ok' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: Request): Promise<{ user: any }> {
    this.logger.log('GET /auth/me');
    const user = await this.auth.getMe((req as any).user.id);
    return { user };
  }

  @Post('logout')
  async logout(@Res() res: Response): Promise<void> {
    this.logger.log('POST /auth/logout');
    res.setHeader('Set-Cookie', [
      'access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
      'refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    ]);
    res.json({ status: 'ok' });
  }
}
