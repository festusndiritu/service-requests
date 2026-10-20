import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { config } from '../config';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyResetCodeDto } from './auth.dto';
import { AuthService } from './auth.service';
import { AuthUser, CurrentUser, Public } from './decorators';

const COOKIE = 'token';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = { httpOnly: true, secure: config.isProd, sameSite: 'lax' as const, path: '/' };

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.register(dto);
    res.cookie(COOKIE, token, { ...cookieOptions, maxAge: WEEK_MS });
    return user;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto);
    res.cookie(COOKIE, token, { ...cookieOptions, maxAge: WEEK_MS });
    return user;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-reset-code')
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.auth.verifyResetCode(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE, cookieOptions);
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.sub);
  }
}
