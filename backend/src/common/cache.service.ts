import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private store = new Map<string, { value: unknown; exp: number }>();

  get<T>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.exp < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  set(key: string, value: unknown, ttlMs = 30000): void {
    this.store.set(key, { value, exp: Date.now() + ttlMs });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  clearPrefix(prefix: string): void {
    for (const k of this.store.keys()) if (k.startsWith(prefix)) this.store.delete(k);
  }
}