import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { config } from '../config';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { sessionCache } from './session-cache';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyResetCodeDto } from './auth.dto';

const publicUser = (u: User) => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  idNumber: u.idNumber,
  phone: u.phone,
  role: u.role,
});

const OTP_TTL_MS = 10 * 60_000;
const OTP_COOLDOWN_MS = 60_000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_PER_HOUR = 5;
const RESET_TOKEN_TTL_MS = 10 * 60_000;

const findBy = (identifier: string) => (/^\d{8,9}$/.test(identifier) ? { idNumber: identifier } : { email: identifier.toLowerCase() });

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private sms: SmsService,
  ) {}

  async register({ password, ...data }: RegisterDto) {
    try {
      const user = await this.prisma.user.create({
        data: { ...data, passwordHash: await bcrypt.hash(password, 12) },
      });
      return this.session(user);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('An account with this email or ID number already exists');
      }
      throw e;
    }
  }

  async login({ identifier, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: findBy(identifier) });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email/ID number or password');
    }
    return this.session(user);
  }

  // Answers the same way whether or not the account exists
  async forgotPassword({ identifier }: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: findBy(identifier) });
    if (user) await this.sendResetCode(user);
    return { message: 'If an account matches, a 6-digit code has been sent by SMS to the phone number on it.' };
  }

  private async sendResetCode(user: User) {
    const now = Date.now();
    const recent = await this.prisma.passwordReset.findMany({
      where: { userId: user.id, createdAt: { gt: new Date(now - 60 * 60_000) } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    // Limits: one code a minute, five an hour
    if (recent[0] && now - recent[0].createdAt.getTime() < OTP_COOLDOWN_MS) return;
    if (recent.length >= OTP_MAX_PER_HOUR) return;

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const [, reset] = await this.prisma.$transaction([
      this.prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.passwordReset.create({
        data: { userId: user.id, codeHash: this.hashCode(user.id, code), expiresAt: new Date(now + OTP_TTL_MS) },
      }),
    ]);

    const sent = await this.sms.send(
      user.phone,
      `Murang'a County Service Requests: your password reset code is ${code}. It expires in 10 minutes. Never share it with anyone.`,
    );
    if (!sent) {
      // Not delivered: drop it so the cooldown doesn't block a retry
      await this.prisma.passwordReset.delete({ where: { id: reset.id } });
      this.log.error(`Could not deliver a reset code to user ${user.id}`);
    }
  }

  // Step 2: check the SMS code. A good code is consumed and traded for a short-lived token that unlocks the password step.
  async verifyResetCode({ identifier, code }: VerifyResetCodeDto) {
    const invalid = new BadRequestException('That code is invalid or has expired. Request a new one.');
    const user = await this.prisma.user.findUnique({ where: findBy(identifier) });
    if (!user) throw invalid;

    const reset = await this.prisma.passwordReset.findFirst({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!reset || reset.attempts >= OTP_MAX_ATTEMPTS) throw invalid;

    const { attempts } = await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    if (attempts > OTP_MAX_ATTEMPTS) throw invalid;

    const expected = Buffer.from(reset.codeHash);
    const given = Buffer.from(this.hashCode(user.id, code));
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw invalid;

    await this.prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
    const exp = String(Date.now() + RESET_TOKEN_TTL_MS);
    return { resetToken: `${reset.id}.${exp}.${this.tokenSignature(reset.id, exp)}` };
  }

  // Step 3: set the new password. The token is signed by us, expires, and dies once the reset row is deleted below.
  async resetPassword({ resetToken, newPassword }: ResetPasswordDto) {
    const expired = new BadRequestException('Your reset session has expired. Start again to get a new code.');
    const [id, exp, sig] = resetToken.split('.');
    if (!id || !exp || !sig || !(Number(exp) > Date.now())) throw expired;

    const expected = Buffer.from(this.tokenSignature(id, exp));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw expired;

    const reset = await this.prisma.passwordReset.findFirst({ where: { id, usedAt: { not: null } } });
    if (!reset) throw expired;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash: await bcrypt.hash(newPassword, 12), passwordChangedAt: new Date() },
      }),
      this.prisma.passwordReset.deleteMany({ where: { userId: reset.userId } }),
    ]);
    sessionCache.forget(reset.userId);
    return { ok: true };
  }

  private tokenSignature(resetId: string, exp: string) {
    return createHmac('sha256', config.jwtSecret).update(`pwreset:${resetId}:${exp}`).digest('hex');
  }

  private hashCode(userId: string, code: string) {
    return createHmac('sha256', config.jwtSecret).update(`${userId}:${code}`).digest('hex');
  }

  async me(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException();
    return publicUser(user);
  }

  private session(user: User) {
    return { token: this.jwt.sign({ sub: user.id, role: user.role }), user: publicUser(user) };
  }
}
