import { ApiProperty } from '@nestjs/swagger';

export class VehicleImageResponseDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        example: 'https://res.cloudinary.com/demo/image/upload/car.jpg',
    })
    imageUrl: string;

    @ApiProperty({
        example: true,
    })
    isPrimary: boolean;

    @ApiProperty({
        example: 0,
    })
    displayOrder: number;

    @ApiProperty({
        example: '2026-11-20T08:00:00.000Z',
    })
    createdAt: Date;
}