import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req?.method ?? 'UNKNOWN';
    const url = req?.url ?? '';
    const now = Date.now();
    this.logger.log(`${method} ${url} - start`);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${method} ${url} - done (${Date.now() - now}ms)`);
      }),
    );
  }
}