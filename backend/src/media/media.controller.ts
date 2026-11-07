import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DIR = '/var/nuqta/images';

@Controller('media')
export class MediaController {
  @Get(':name')
  async get(@Param('name') name: string, @Res() res: Response): Promise<void> {
    const file = path.join(DIR, path.basename(name));
    if (!fs.existsSync(file)) {
      res.status(404).end();
      return;
    }
    res.sendFile(file);
  }
}