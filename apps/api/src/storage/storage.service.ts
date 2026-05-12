import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'kyc'): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `affiliate-vemtap/${folder}`,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              this.logger.error(`Cloudinary upload failed: ${error.message}`);
              return reject(new BadRequestException(`Cloudinary upload failed: ${error.message}`));
            }
            resolve(result!.secure_url);
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error(`Storage service error: ${error.message}`);
      throw new BadRequestException('Storage service error occurred');
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      // Extract public_id from URL
      const parts = url.split('/');
      const fileNameWithExt = parts[parts.length - 1];
      const publicId = fileNameWithExt.split('.')[0];
      const folderPath = parts.slice(parts.indexOf('affiliate-vemtap'), parts.length - 1).join('/');
      
      const fullPublicId = `${folderPath}/${publicId}`;
      
      await cloudinary.uploader.destroy(fullPublicId);
      this.logger.log(`Deleted file from Cloudinary: ${fullPublicId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from Cloudinary: ${error.message}`);
    }
  }
}
