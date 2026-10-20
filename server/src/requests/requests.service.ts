import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceRequest, Status } from '@prisma/client';
import { periodStart } from '../analytics/period';
import { AuthUser } from '../auth/decorators';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateRequestDto, ListQueryDto, TrackQueryDto, UpdateStatusDto } from './requests.dto';

const STATUS_ORDER: Status[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

const CATEGORY_LABEL: Record<string, string> = {
  WATER_SUPPLY: 'Water supply',
  STREET_LIGHTING: 'Street lighting',
  GARBAGE_COLLECTION: 'Garbage collection',
  ROAD_MAINTENANCE: 'Road maintenance',
  SEWERAGE_DRAINAGE: 'Sewerage & drainage',
  PUBLIC_HEALTH: 'Public health & sanitation',
  PUBLIC_SAFETY: 'Public safety',
  MARKETS_TRADING: 'Markets & trading',
  ENVIRONMENT_PARKS: 'Environment & parks',
  OTHER: 'Other',
};

const STATUS_LABEL: Record<Status, string> = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved' };

const reference = (r: Pick<ServiceRequest, 'number' | 'createdAt'>) =>
  `PRS-${r.createdAt.getUTCFullYear()}-${String(r.number).padStart(4, '0')}`;

const summary = (r: ServiceRequest & { user: { fullName: string } }) => ({
  id: r.id,
  reference: reference(r),
  category: r.category,
  location: r.location,
  status: r.status,
  createdAt: r.createdAt,
  submittedBy: r.user.fullName,
});

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
    private notifications: NotificationsService,
  ) {}

  private scope(user: AuthUser): Prisma.ServiceRequestWhereInput {
    return user.role === 'ADMIN' ? {} : { userId: user.sub };
  }

  async create(user: AuthUser, dto: CreateRequestDto) {
    const imageKeys = dto.imageKeys ?? [];
    await Promise.all(imageKeys.map((key) => this.uploads.assertUploaded(user.sub, key)));
    const created = await this.prisma.serviceRequest.create({
      data: {
        ...dto,
        imageKeys,
        userId: user.sub,
        history: { create: { status: 'PENDING', note: 'Request submitted', createdById: user.sub } },
      },
      select: { id: true, number: true, createdAt: true, user: { select: { fullName: true } } },
    });
    await this.notifications.notifyAdmins({
      type: 'REQUEST_SUBMITTED',
      title: `New request ${reference(created)}`,
      body: `${CATEGORY_LABEL[dto.category]} at ${dto.location}, submitted by ${created.user.fullName}.`,
      requestId: created.id,
    });
    return this.findOne(user, created.id);
  }

  async list(user: AuthUser, { status, category, q, page, pageSize }: ListQueryDto) {
    const where: Prisma.ServiceRequestWhereInput = { ...this.scope(user), status, category };
    if (q) {
      const number = q.match(/(\d{1,9})$/)?.[1];
      where.OR = [
        { location: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        ...(number ? [{ number: Number(number) }] : []),
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({
        where,
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);
    return { items: items.map(summary), total, page, pageSize };
  }

  async stats(user: AuthUser) {
    const rows = await this.prisma.serviceRequest.groupBy({
      by: ['status'],
      where: this.scope(user),
      _count: true,
    });
    const count = (s: Status) => rows.find((r) => r.status === s)?._count ?? 0;
    return {
      total: rows.reduce((sum, r) => sum + r._count, 0),
      pending: count('PENDING'),
      inProgress: count('IN_PROGRESS'),
      resolved: count('RESOLVED'),
    };
  }

  /** Everything the dashboard shows in one round trip: counts, the latest requests and (admins) the category split. */
  async dashboard(user: AuthUser) {
    const isAdmin = user.role === 'ADMIN';
    const [stats, recent, byCategory] = await Promise.all([
      this.stats(user),
      this.prisma.serviceRequest.findMany({
        where: this.scope(user),
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: isAdmin ? 6 : 5,
      }),
      isAdmin
        ? this.prisma.serviceRequest.groupBy({
            by: ['category'],
            where: { createdAt: { gte: periodStart(30) } },
            _count: true,
            orderBy: { _count: { category: 'desc' } },
          })
        : [],
    ]);
    return {
      stats,
      recent: recent.map(summary),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
    };
  }

  /**
   * Public lookup. References are sequential, so they must be paired with the last 4 digits of the submitter's
   * phone. Only status information is returned, and every failure looks the same.
   */
  async track({ reference: ref, phone }: TrackQueryDto) {
    const notFound = new NotFoundException("We couldn't find a request matching those details.");
    const number = Number(ref.split('-')[2]);
    if (!Number.isSafeInteger(number) || number > 2_147_483_647) throw notFound;

    const r = await this.prisma.serviceRequest.findUnique({
      where: { number },
      include: {
        user: { select: { phone: true } },
        history: { orderBy: { createdAt: 'asc' }, select: { id: true, status: true, note: true, createdAt: true } },
      },
    });
    const lastFour = r?.user.phone.replace(/\D/g, '').slice(-4);
    if (!r || reference(r) !== ref || lastFour !== phone) throw notFound;

    return { reference: reference(r), category: r.category, status: r.status, createdAt: r.createdAt, history: r.history };
  }

  async findOne(user: AuthUser, id: string) {
    const r = await this.prisma.serviceRequest.findFirst({
      where: { id, ...this.scope(user) },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        history: { orderBy: { createdAt: 'asc' }, include: { createdBy: { select: { fullName: true } } } },
      },
    });
    if (!r) throw new NotFoundException('Request not found');
    return {
      id: r.id,
      reference: reference(r),
      category: r.category,
      location: r.location,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      imageUrls: await Promise.all(r.imageKeys.map((key) => this.uploads.viewUrl(key))),
      submittedBy: r.user,
      history: r.history.map((h) => ({
        id: h.id,
        status: h.status,
        note: h.note,
        createdAt: h.createdAt,
        by: h.createdBy.fullName,
      })),
    };
  }

  async updateStatus(user: AuthUser, id: string, dto: UpdateStatusDto) {
    const current = await this.prisma.serviceRequest.findUnique({
      where: { id },
      select: { status: true, userId: true, number: true, createdAt: true, category: true, location: true },
    });
    if (!current) throw new NotFoundException('Request not found');
    if (STATUS_ORDER.indexOf(dto.status) <= STATUS_ORDER.indexOf(current.status)) {
      throw new BadRequestException('Status can only move forward');
    }
    await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: dto.status,
        history: { create: { status: dto.status, note: dto.note || null, createdById: user.sub } },
      },
    });
    await this.notifications.notify([current.userId], {
      type: 'STATUS_CHANGED',
      title: `${reference(current)} is now ${STATUS_LABEL[dto.status]}`,
      body: dto.note
        ? `${CATEGORY_LABEL[current.category]} at ${current.location}. Note from the county: ${dto.note}`
        : `${CATEGORY_LABEL[current.category]} at ${current.location}.`,
      requestId: id,
    });
    return this.findOne(user, id);
  }
}
