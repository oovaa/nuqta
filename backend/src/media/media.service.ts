import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

const DIR = '/var/nuqta/images';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  async save(file: { buffer: Buffer; originalname?: string }): Promise<string> {
    this.logger.log(`save file ${file.originalname}`);
    await fs.mkdir(DIR, { recursive: true });
    const ext = path.extname(file.originalname ?? '') || '';
    const name = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    await fs.writeFile(path.join(DIR, name), file.buffer);
    return `/media/${name}`;
  }

  async saveMany(files: { buffer: Buffer; originalname?: string }[]): Promise<string[]> {
    const out: string[] = [];
    for (const f of files) out.push(await this.save(f));
    return out;
  }
}