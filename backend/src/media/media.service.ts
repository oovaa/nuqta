import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

const DIR = '/var/nuqta/images';
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.avif']);
const IMAGE_MIMES = new Set([
  'ffd8ff', // jpeg
  '89504e47', // png
  '47494638', // gif
  '52494646', // webp/riff
]);

function isImage(file: { buffer: Buffer; originalname?: string }): boolean {
  const ext = path.extname(file.originalname ?? '').toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return false;
  if (!file.buffer || file.buffer.length < 4) return false;
  const hex = file.buffer.subarray(0, 4).toString('hex');
  // svg is text; allow by extension only
  if (ext === '.svg') return true;
  return IMAGE_MIMES.has(hex.slice(0, 8)) || IMAGE_MIMES.has(hex.slice(0, 6));
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  async save(file: { buffer: Buffer; originalname?: string }): Promise<string> {
    if (!isImage(file)) throw new BadRequestException('Only image files are allowed');
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
