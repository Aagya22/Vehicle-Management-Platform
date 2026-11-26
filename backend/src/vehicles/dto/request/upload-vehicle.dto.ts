
import { ApiProperty } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto.js';

export class UploadVehicleDto extends CreateVehicleDto {
    @ApiProperty({
        type: 'array',
        items: {
            type: 'string',
            format: 'binary',
        },
        description:
            'Vehicle images (JPEG, PNG, or WebP). Maximum 10 images, 5 MB each.',
        maxItems: 10,
    })
    images: string[];
}
