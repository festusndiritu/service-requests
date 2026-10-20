import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { config } from '../config';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS = 3;
export const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};
const IMAGE_EXTENSIONS = [...new Set(Object.values(IMAGE_TYPES))].join('|');

@Injectable()
export class UploadsService {
  private s3 = config.r2
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${config.r2.accountId}.${config.r2.jurisdiction ? config.r2.jurisdiction + '.' : ''}r2.cloudflarestorage.com`,
        credentials: { accessKeyId: config.r2.accessKeyId, secretAccessKey: config.r2.secretAccessKey },
        // R2 rejects the CRC32 checksum params newer SDK versions add to presigned URLs
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      })
    : null;

  private client() {
    if (!this.s3 || !config.r2) throw new ServiceUnavailableException('Image uploads are not configured');
    return { s3: this.s3, bucket: config.r2.bucket };
  }

  async presignUpload(userId: string, contentType: string) {
    const { s3, bucket } = this.client();
    const key = `requests/${userId}/${randomUUID()}.${IMAGE_TYPES[contentType]}`;
    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), {
      expiresIn: 300,
    });
    return { uploadUrl, key };
  }

  async assertUploaded(userId: string, key: string) {
    const valid = new RegExp(`^requests/${userId}/[0-9a-f-]{36}\\.(${IMAGE_EXTENSIONS})$`);
    if (!valid.test(key)) throw new BadRequestException('Invalid image');
    const { s3, bucket } = this.client();
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      if ((head.ContentLength ?? 0) > MAX_IMAGE_BYTES) throw new BadRequestException('Image is larger than 5MB');
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Image was not uploaded');
    }
  }

  viewUrl(key: string) {
    const { s3, bucket } = this.client();
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
  }
}
