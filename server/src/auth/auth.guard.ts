import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC } from './decorators';
import { sessionCache } from './session-cache';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.token;
    if (!token) throw new UnauthorizedException();
    let payload: { sub: string; role: 'CITIZEN' | 'ADMIN'; iat: number };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }
    // A password reset signs out every session issued before it
    let session = sessionCache.get(payload.sub);
    if (!session) {
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { passwordChangedAt: true } });
      if (!user) throw new UnauthorizedException();
      sessionCache.set(payload.sub, user.passwordChangedAt);
      session = sessionCache.get(payload.sub)!;
    }
    if (session.passwordChangedAt && session.passwordChangedAt > payload.iat * 1000) throw new UnauthorizedException();
    req.user = payload;
    return true;
  }
}
