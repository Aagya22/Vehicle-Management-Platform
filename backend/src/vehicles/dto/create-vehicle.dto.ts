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

import { VehicleType } from '../entities/vehicle.entity.js';

export class CreateVehicleDto {
    @IsString()
    @IsNotEmpty()
    vehicleCode: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    brand: string;

    @IsString()
    @IsNotEmpty()
    model: string;

    @IsEnum(VehicleType)
    vehicleType: VehicleType;

    @Type(() => Number)
    @IsInt()
    @Min(1900)
    @Max(2100)
    year: number;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;
}
