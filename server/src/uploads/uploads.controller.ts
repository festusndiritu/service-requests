import { Body, Controller, Post } from '@nestjs/common';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { CurrentUser, AuthUser, Roles } from '../auth/decorators';
import { IMAGE_TYPES, MAX_IMAGE_BYTES, UploadsService } from './uploads.service';

class PresignDto {
  @IsIn(Object.keys(IMAGE_TYPES), { message: 'Photo must be a PNG, JPG, WebP, GIF or AVIF image' })
  contentType: string;

  @IsInt()
  @Min(1)
  @Max(MAX_IMAGE_BYTES, { message: 'Image must be 5MB or smaller' })
  size: number;
}

@Controller('uploads')
export class UploadsController {
  constructor(private uploads: UploadsService) {}

  @Roles('CITIZEN')
  @Post('presign')
  presign(@CurrentUser() user: AuthUser, @Body() dto: PresignDto) {
    return this.uploads.presignUpload(user.sub, dto.contentType);
  }
}
