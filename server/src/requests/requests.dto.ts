import { Category, Status } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';
import { MAX_PHOTOS } from '../uploads/uploads.service';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateRequestDto {
  @IsEnum(Category)
  category: Category;

  @Transform(trim)
  @IsString()
  @Length(3, 200)
  location: string;

  @Transform(trim)
  @IsString()
  @Length(10, 2000, { message: 'Description must be at least 10 characters' })
  description: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PHOTOS, { message: `You can attach up to ${MAX_PHOTOS} photos` })
  @ArrayUnique()
  @IsString({ each: true })
  imageKeys?: string[];
}

export class UpdateStatusDto {
  @IsEnum(Status)
  status: Status;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ListQueryDto {
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 10;
}

export class TrackQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^PRS-\d{4}-\d{1,8}$/, { message: 'Enter the reference exactly as shown, e.g. PRS-2026-0012' })
  reference: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\d{4}$/, { message: 'Enter the last 4 digits of your phone number' })
  phone: string;
}
