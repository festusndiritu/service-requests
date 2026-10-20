import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NewNotification {
  type: NotificationType;
  title: string;
  body: string;
  requestId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  // Never throws: a failed notification must not fail the action that caused it
  async notify(userIds: string[], n: NewNotification) {
    if (userIds.length === 0) return;
    try {
      await this.prisma.notification.createMany({ data: userIds.map((userId) => ({ ...n, userId })) });
    } catch (e) {
      this.log.error('Failed to create notifications', e instanceof Error ? e.stack : String(e));
    }
  }

  async notifyAdmins(n: NewNotification) {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await this.notify(
      admins.map((a) => a.id),
      n,
    );
  }

  async list(userId: string, { unreadOnly, page, pageSize }: { unreadOnly: boolean; page: number; pageSize: number }) {
    const where: Prisma.NotificationWhereInput = { userId, ...(unreadOnly ? { readAt: null } : {}) };
    const [items, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, type: true, title: true, body: true, requestId: true, readAt: true, createdAt: true },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, total, unread, page, pageSize };
  }

  async unreadCount(userId: string) {
    return { unread: await this.prisma.notification.count({ where: { userId, readAt: null } }) };
  }

  async markRead(userId: string, id: string) {
    const { count } = await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    if (count === 0 && !(await this.prisma.notification.findFirst({ where: { id, userId }, select: { id: true } }))) {
      throw new NotFoundException('Notification not found');
    }
    return this.unreadCount(userId);
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { unread: 0 };
  }
}
