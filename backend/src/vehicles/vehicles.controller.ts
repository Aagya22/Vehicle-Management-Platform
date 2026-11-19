
import {
    Controller,
    Get,
    Query,
    Post,
    Body,
    UploadedFiles,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

import { VehiclesService } from './vehicles.service.js';
import { VehicleQueryDto } from './dto/vehicle-query.dto.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';

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

    @Post()
    @UseInterceptors(
        FilesInterceptor('images', 10, {
            limits: {
                fileSize: 5 * 1024 * 1024, // max 5 mb eauta image ko size
            },
            fileFilter: (req, file, callback) => {
                if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
                    return callback(
                        new BadRequestException(
                            'Only JPEG, PNG, and WebP images are allowed',
                        ),
                        false,
                    );
                }

                callback(null, true);
            },
        }),
    )
    create(
        @Body() createVehicleDto: CreateVehicleDto,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException(
                'At least one vehicle image is required',
            );
        }

        return this.vehiclesService.create(
            createVehicleDto,
            files,
        );
    }
}
