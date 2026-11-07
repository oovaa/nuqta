import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DIR = '/var/nuqta/images';

@Controller('media')
export class MediaController {
  @Get(':name')
  async get(@Param('name') name: string, @Res() res: Response): Promise<void> {
    const safe = path.basename(name);
    const ext = path.extname(safe).toLowerCase();
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.avif']);
    if (!allowed.has(ext)) {
      res.status(400).end();
      return;
    }
    const file = path.join(DIR, safe);
    if (!fs.existsSync(file)) {
      res.status(404).end();
      return;
    }
    res.sendFile(file);
  }
}