import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { VehicleType } from '../../entities/vehicle.entity.js';

export class CreateVehicleDto {
    @ApiProperty({
        example: 'VEH-001',
        description: 'Unique identification code assigned to the vehicle.',
    })
    @IsString()
    @IsNotEmpty()
    vehicleCode: string;

    @ApiProperty({
        example: 'Toyota Corolla',
        description: 'Name of the vehicle.',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: 'Toyota',
        description: 'Manufacturer or brand of the vehicle.',
    })
    @IsString()
    @IsNotEmpty()
    brand: string;

    @ApiProperty({
        example: 'Corolla',
        description: 'Model of the vehicle.',
    })
    @IsString()
    @IsNotEmpty()
    model: string;

    @ApiProperty({
        enum: VehicleType,
        example: VehicleType.CAR,
        description: 'Category of the vehicle.',
    })
    @IsEnum(VehicleType)
    vehicleType: VehicleType;

    @ApiProperty({
        example: 2023,
        minimum: 1900,
        maximum: 2100,
        description: 'Manufacturing year of the vehicle.',
    })
    @Type(() => Number)
    @IsInt()
    @Min(1900)
    @Max(2100)
    year: number;

    @ApiPropertyOptional({
        example: 'Well-maintained vehicle with excellent condition.',
        description: 'Additional details about the vehicle.',
        type: String,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        example: 3500000,
        minimum: 0,
        description: 'Vehicle price.',
    })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;
}
