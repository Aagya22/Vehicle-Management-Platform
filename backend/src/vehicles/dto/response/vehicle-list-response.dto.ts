
import { ApiProperty } from '@nestjs/swagger';
import { VehicleResponseDto } from './vehicle-response.dto.js';

export class VehiclePaginationMetaDto {
    @ApiProperty({
        example: 50,
        description: 'Total number of vehicles',
    })
    total: number;

    @ApiProperty({
        example: 1,
        description: 'Current page number',
    })
    page: number;

    @ApiProperty({
        example: 10,
        description: 'Number of vehicles per page',
    })
    limit: number;

    @ApiProperty({
        example: 5,
        description: 'Total number of available pages',
    })
    totalPages: number;
}

export class VehicleListResponseDto {
    @ApiProperty({
        type: () => [VehicleResponseDto],
        description: 'List of vehicles',
    })
    data: VehicleResponseDto[];

    @ApiProperty({
        type: () => VehiclePaginationMetaDto,
        description: 'Pagination information',
    })
    meta: VehiclePaginationMetaDto;
}
