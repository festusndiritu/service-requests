import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DAY_MS, EAT_OFFSET_MS, periodStart } from './period';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async overview(days: number) {
    const since = periodStart(days);
    const prevSince = new Date(since.getTime() - days * DAY_MS);

    // PENDING history rows are submissions and RESOLVED rows are resolutions
    const [byCategory, trendRows, previousRows, avg] = await Promise.all([
      this.prisma.serviceRequest.groupBy({
        by: ['category'],
        where: { createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { category: 'desc' } },
      }),
      this.prisma.$queryRaw<{ day: string; status: string; count: number }[]>`
        SELECT to_char(date_trunc('day', "createdAt" + interval '3 hours'), 'YYYY-MM-DD') AS day,
               status::text AS status,
               COUNT(*)::int AS count
        FROM "StatusUpdate"
        WHERE status IN ('PENDING', 'RESOLVED') AND "createdAt" >= ${since}
        GROUP BY 1, 2`,
      this.prisma.$queryRaw<{ submitted: number; resolved: number }[]>`
        SELECT COUNT(*) FILTER (WHERE status = 'PENDING')::int AS submitted,
               COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved
        FROM "StatusUpdate"
        WHERE status IN ('PENDING', 'RESOLVED') AND "createdAt" >= ${prevSince} AND "createdAt" < ${since}`,
      this.prisma.$queryRaw<{ hours: number | null }[]>`
        SELECT (AVG(EXTRACT(EPOCH FROM (u."createdAt" - r."createdAt"))) / 3600)::float8 AS hours
        FROM "StatusUpdate" u
        JOIN "ServiceRequest" r ON r.id = u."requestId"
        WHERE u.status = 'RESOLVED' AND u."createdAt" >= ${since}`,
    ]);

    const trend = Array.from({ length: days }, (_, i) => {
      const date = new Date(since.getTime() + i * DAY_MS + EAT_OFFSET_MS).toISOString().slice(0, 10);
      const count = (status: string) => trendRows.find((r) => r.day === date && r.status === status)?.count ?? 0;
      return { date, submitted: count('PENDING'), resolved: count('RESOLVED') };
    });

    return {
      days,
      period: {
        submitted: trend.reduce((sum, d) => sum + d.submitted, 0),
        resolved: trend.reduce((sum, d) => sum + d.resolved, 0),
      },
      previous: previousRows[0] ?? { submitted: 0, resolved: 0 },
      avgResolutionHours: avg[0]?.hours ?? null,
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
      trend,
    };
  }
}
