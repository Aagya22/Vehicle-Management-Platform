
import { Controller, Get, Query } from '@nestjs/common';

import { VehiclesService } from './vehicles.service.js';
import { VehicleQueryDto } from './dto/vehicle-query.dto.js';

@Controller('vehicles')
export class VehiclesController {
    constructor(
        private readonly vehiclesService: VehiclesService,
    ) { }

    @Get()
    findAll(@Query() query: VehicleQueryDto) {
        return this.vehiclesService.findAll(
            query.page,
            query.limit,
        );
    }
}
