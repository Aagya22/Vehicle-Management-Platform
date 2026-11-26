import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { VehicleType } from '../../entities/vehicle.entity.js';
import { VehicleImageResponseDto } from './vehicle-image-response.dto.js';

export class VehicleResponseDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        example: 'VEH-001',
    })
    vehicleCode: string;

    @ApiProperty({
        example: 'Toyota Corolla',
    })
    name: string;

    @ApiProperty({
        example: 'Toyota',
    })
    brand: string;

    @ApiProperty({
        example: 'Corolla',
    })
    model: string;

    @ApiProperty({
        enum: VehicleType,
        example: VehicleType.CAR,
    })
    vehicleType: VehicleType;

    @ApiProperty({
        example: 2023,
    })
    year: number;

    @ApiProperty({
        example: 'Well-maintained vehicle',
        nullable: true,
    })
    description: string | null;

    @ApiProperty({
        example: '3500000.00',
        description: 'Vehicle price represented as a decimal string',
    })
    price: string;

    @ApiProperty({
        type: () => [VehicleImageResponseDto],
    })
    images: VehicleImageResponseDto[];

    @ApiProperty({
        example: '2026-11-20T08:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2026-11-20T08:00:00.000Z',
    })
    updatedAt: Date;
}