
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VehiclesController } from './vehicles.controller.js';
import { VehiclesService } from './vehicles.service.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { VehicleImage } from './entities/vehicle-image.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, VehicleImage]), CloudinaryModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule { }
