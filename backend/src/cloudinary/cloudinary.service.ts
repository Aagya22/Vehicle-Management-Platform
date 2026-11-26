import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.getOrThrow<string>(
                'CLOUDINARY_CLOUD_NAME',
            ),
            api_key: this.configService.getOrThrow<string>(
                'CLOUDINARY_API_KEY',
            ),
            api_secret: this.configService.getOrThrow<string>(
                'CLOUDINARY_API_SECRET',
            ),
        });
    }

    async uploadImage(
        file: Express.Multer.File,
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'vehicle-management-platform/vehicles',
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }

                    if (!result) {
                        return reject(
                            new Error('Image upload failed'),
                        );
                    }

                    resolve(result);
                },
            );

            uploadStream.end(file.buffer);
        });
    }
}
