import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service.js';
import { ShippingController } from './shipping.controller.js';

@Module({
  controllers: [ShippingController],
  providers: [ShippingService],
})
export class ShippingModule {}