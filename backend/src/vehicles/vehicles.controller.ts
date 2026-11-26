
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

import {
    ApiTags,
    ApiOperation,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiBadRequestResponse,
    ApiInternalServerErrorResponse,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';

import { VehiclesService } from './vehicles.service.js';

import { VehicleImagesInterceptor } from './interceptors/vehicle-images.interceptor.js';

import { VehicleQueryDto } from './dto/request/vehicle-query.dto.js';
import { CreateVehicleDto } from './dto/request/create-vehicle.dto.js';
import { UploadVehicleDto } from './dto/request/upload-vehicle.dto.js';

import { VehicleListResponseDto } from './dto/response/vehicle-list-response.dto.js';
import { VehicleResponseDto } from './dto/response/vehicle-response.dto.js';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
    constructor(
        private readonly vehiclesService: VehiclesService,
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Get all vehicles',
        description:
            'Retrieve a paginated list of vehicles, including their images.',
    })
    @ApiOkResponse({
        description: 'Vehicles retrieved successfully.',
        type: VehicleListResponseDto,
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error.',
    })
    findAll(@Query() query: VehicleQueryDto) {
        return this.vehiclesService.findAll(
            query.page,
            query.limit,
        );
    }

    @Post()
    @UseInterceptors(VehicleImagesInterceptor)
    @ApiOperation({
        summary: 'Create a vehicle',
        description:
            'Create a vehicle with multiple images. Images are uploaded to Cloudinary, and the first uploaded image becomes the primary image.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: UploadVehicleDto,
    })
    @ApiCreatedResponse({
        description: 'Vehicle created successfully.',
        type: VehicleResponseDto,
    })
    @ApiBadRequestResponse({
        description:
            'Invalid vehicle data or missing/invalid images.',
    })
    @ApiInternalServerErrorResponse({
        description:
            'Internal server error while creating the vehicle.',
    })
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
