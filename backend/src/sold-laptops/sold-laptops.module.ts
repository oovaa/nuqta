import { Module } from '@nestjs/common';
import { SoldLaptopsService } from './sold-laptops.service.js';
import { SoldLaptopsController } from './sold-laptops.controller.js';
import { MediaModule } from '../media/media.module.js';

@Module({
  imports: [MediaModule],
  controllers: [SoldLaptopsController],
  providers: [SoldLaptopsService],
})
export class SoldLaptopsModule {}