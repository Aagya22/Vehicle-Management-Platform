
import {
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vehicle } from './entities/vehicle.entity.js';
import { VehicleImage } from './entities/vehicle-image.entity.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Vehicle)
        private readonly vehicleRepository: Repository<Vehicle>,

        @InjectRepository(VehicleImage)
        private readonly vehicleImageRepository: Repository<VehicleImage>,

        private readonly cloudinaryService: CloudinaryService,
    ) { }

    async findAll(page: number, limit: number) {
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
            data: vehicles,
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
    ) {
        if (!files || files.length === 0) {
            throw new InternalServerErrorException(
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

        return this.vehicleRepository.findOne({
            where: {
                id: savedVehicle.id,
            },
            relations: {
                images: true,
            },
        });
    }
}
