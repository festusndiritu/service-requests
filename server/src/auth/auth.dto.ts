import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const noSpaces = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value);

export class RegisterDto {
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  fullName: string;

  @Transform(lower)
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @Transform(noSpaces)
  @Matches(/^\d{8,9}$/, { message: 'ID number must be 8 or 9 digits' })
  idNumber: string;

  @Transform(noSpaces)
  @Matches(/^(\+254|0)[17]\d{8}$/, { message: 'Enter a valid Kenyan phone number' })
  phone: string;

  // bcrypt only uses the first 72 bytes
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72)
  password: string;
}

export class LoginDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ForgotPasswordDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  identifier: string;
}

export class VerifyResetCodeDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  identifier: string;

  @Transform(noSpaces)
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code from the SMS' })
  code: string;
}

export class ResetPasswordDto {
  // Issued by verify-reset-code once the SMS code has been checked
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  resetToken: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72)
  newPassword: string;
}
