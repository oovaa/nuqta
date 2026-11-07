import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { AuthedRequest } from './auth.guard.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const user = req.user;
    if (!user || user.role !== 'admin') {
      console.log('not an admin');
      throw new ForbiddenException();
    }
    return true;
  }
}
