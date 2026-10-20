import 'dotenv/config';
import { Category, PrismaClient, Status } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DAY = 86_400_000;
const CATEGORIES = Object.values(Category);
const PLACES = [
  'Kenol Market',
  'Kangari Town',
  'Maragua Ridge',
  'Kandara Road',
  'Kahuro Junction',
  "Murang'a Town Centre",
  'Makuyu Stage',
  'Kigumo Bendera',
  'Kangema Hospital Road',
  'Gatanga Road',
];
const TITLES: Record<Category, string[]> = {
  WATER_SUPPLY: ['No water supply for three days', 'Burst pipe flooding the road'],
  STREET_LIGHTING: ['Streetlight not working near the junction', 'Flickering lights along the main road'],
  GARBAGE_COLLECTION: ['Garbage not collected this week', 'Overflowing bins at the market'],
  ROAD_MAINTENANCE: ['Large potholes slowing traffic', 'Road washed out after heavy rain'],
  SEWERAGE_DRAINAGE: ['Blocked drain flooding the footpath', 'Sewer overflow behind the shops'],
  PUBLIC_HEALTH: ['Public toilet closed and unsanitary', 'Stray dogs and waste near the dispensary'],
  PUBLIC_SAFETY: ['Dark and unsafe path near the school', 'Missing manhole cover on the main road'],
  MARKETS_TRADING: ['Stalls blocking the market entrance', 'Market water point not working'],
  ENVIRONMENT_PARKS: ['Fallen tree blocking the park path', 'Illegal dumping along the riverbank'],
  OTHER: ['Broken public bench at the stage', 'Overgrown bushes blocking the footpath'],
};

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

// Adds a demo citizen and about 40 requests over the last 30 days. Only run this on a database you can fill with sample data.
async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('No admin found. Run `npm run db:seed` first.');

  const citizen = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      fullName: 'John Mwangi',
      email: 'john@example.com',
      idNumber: '12345678',
      phone: '0712345678',
      passwordHash: await bcrypt.hash('Password123', 12),
    },
  });

  const now = Date.now();
  for (let i = 0; i < 40; i++) {
    const category = pick(CATEGORIES);
    const createdAt = new Date(now - Math.random() * 29 * DAY);
    const history: { status: Status; note: string; createdAt: Date; createdById: string }[] = [
      { status: 'PENDING', note: 'Request submitted', createdAt, createdById: citizen.id },
    ];

    const inProgressAt = new Date(createdAt.getTime() + (0.5 + Math.random() * 2) * DAY);
    if (Math.random() < 0.7 && inProgressAt.getTime() < now) {
      history.push({ status: 'IN_PROGRESS', note: 'Assigned to maintenance team', createdAt: inProgressAt, createdById: admin.id });
      const resolvedAt = new Date(inProgressAt.getTime() + (0.5 + Math.random() * 4) * DAY);
      if (Math.random() < 0.6 && resolvedAt.getTime() < now) {
        history.push({ status: 'RESOLVED', note: 'Issue fixed', createdAt: resolvedAt, createdById: admin.id });
      }
    }

    await prisma.serviceRequest.create({
      data: {
        category,
        location: pick(PLACES),
        description: `${pick(TITLES[category])}. Please send someone to check as soon as possible.`,
        status: history[history.length - 1].status,
        createdAt,
        userId: citizen.id,
        history: { create: history },
      },
    });
  }
  console.log('Demo data added. Citizen login: john@example.com / Password123');
}

main().finally(() => prisma.$disconnect());
