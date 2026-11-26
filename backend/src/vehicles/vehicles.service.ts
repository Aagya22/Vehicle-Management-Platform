
import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vehicle } from './entities/vehicle.entity.js';
import { VehicleImage } from './entities/vehicle-image.entity.js';

import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { CreateVehicleDto } from './dto/request/create-vehicle.dto.js';

import type { VehicleResponseDto } from './dto/response/vehicle-response.dto.js';
import type { VehicleListResponseDto } from './dto/response/vehicle-list-response.dto.js';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Vehicle)
        private readonly vehicleRepository: Repository<Vehicle>,

        @InjectRepository(VehicleImage)
        private readonly vehicleImageRepository: Repository<VehicleImage>,

        private readonly cloudinaryService: CloudinaryService,
    ) { }

    async findAll(
        page: number,
        limit: number,
    ): Promise<VehicleListResponseDto> {
        const [vehicles, total] = await this.vehicleRepository.findAndCount({
            relations: {
                images: true,
            },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                createdAt: 'DESC',
                vehicleCode: 'ASC',
            },
        });

        return {
            data: vehicles.map((vehicle) =>
                this.toVehicleResponse(vehicle),
            ),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async create(
        createVehicleDto: CreateVehicleDto,
        files: Express.Multer.File[],
    ): Promise<VehicleResponseDto> {
        if (!files || files.length === 0) {
            throw new BadRequestException(
                'At least one vehicle image is required',
            );
        }

        const uploadResults = await Promise.all(
            files.map((file) =>
                this.cloudinaryService.uploadImage(file),
            ),
        );

        const vehicle = this.vehicleRepository.create({
            ...createVehicleDto,
            price: createVehicleDto.price.toString(),
        });

        const savedVehicle = await this.vehicleRepository.save(vehicle);

        const vehicleImages = uploadResults.map((result, index) =>
            this.vehicleImageRepository.create({
                imageUrl: result.secure_url,
                publicId: result.public_id,
                isPrimary: index === 0,
                displayOrder: index,
                vehicleId: savedVehicle.id,
            }),
        );

        await this.vehicleImageRepository.save(vehicleImages);

        const createdVehicle = await this.vehicleRepository.findOne({
            where: {
                id: savedVehicle.id,
            },
            relations: {
                images: true,
            },
        });

        if (!createdVehicle) {
            throw new InternalServerErrorException(
                'Vehicle was created but could not be retrieved',
            );
        }

        return this.toVehicleResponse(createdVehicle);
    }

    private toVehicleResponse(
        vehicle: Vehicle,
    ): VehicleResponseDto {
        return {
            id: vehicle.id,
            vehicleCode: vehicle.vehicleCode,
            name: vehicle.name,
            brand: vehicle.brand,
            model: vehicle.model,
            vehicleType: vehicle.vehicleType,
            year: vehicle.year,
            description: vehicle.description,
            price: vehicle.price,

            images: vehicle.images.map((image) => ({
                id: image.id,
                imageUrl: image.imageUrl,
                isPrimary: image.isPrimary,
                displayOrder: image.displayOrder,
                createdAt: image.createdAt,
            })),

            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt,
        };
    }
}
