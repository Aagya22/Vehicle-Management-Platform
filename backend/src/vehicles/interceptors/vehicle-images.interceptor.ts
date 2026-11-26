import { BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

export const VehicleImagesInterceptor = FilesInterceptor(
    'images',
    10,
    {
        limits: {
            fileSize: 5 * 1024 * 1024,
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
    },
);
