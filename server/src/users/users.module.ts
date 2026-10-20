import { Controller, Get, Module } from '@nestjs/common';
import { Roles } from '../auth/decorators';
import { PrismaService } from '../prisma/prisma.service';

@Roles('ADMIN')
@Controller('users')
class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        fullName: true,
        email: true,
        idNumber: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { requests: true } },
      },
    });
    return users.map(({ _count, ...u }) => ({ ...u, requestCount: _count.requests }));
  }
}

@Module({ controllers: [UsersController] })
export class UsersModule {}
