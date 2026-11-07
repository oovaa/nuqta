import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import * as crypto from 'node:crypto';

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(v ?? '');
  }
  return out;
}

function verifyToken(token: string, secret: string): { sub: number; role: string } | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null;
    return { sub: Number(payload.sub), role: String(payload.role ?? 'user') };
  } catch {
    return null;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const cookies = parseCookies(req.headers.cookie);
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const payload = cookies.access_token ? verifyToken(cookies.access_token, secret) : null;
    if (!payload) throw new UnauthorizedException();
    (req as any).user = { id: payload.sub, role: payload.role };
    return true;
  }
}