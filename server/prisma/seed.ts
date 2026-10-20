import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Creates the first admin from the ADMIN_* variables. Safe to re-run: an existing admin is left untouched.
async function main() {
  const { ADMIN_EMAIL, ADMIN_ID_NUMBER, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_ID_NUMBER || !ADMIN_PASSWORD) {
    console.log('Skipping admin seed: set ADMIN_EMAIL, ADMIN_ID_NUMBER and ADMIN_PASSWORD');
    return;
  }
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    update: {},
    create: {
      fullName: 'County Admin',
      email: ADMIN_EMAIL.toLowerCase(),
      idNumber: ADMIN_ID_NUMBER,
      phone: '0700000000',
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: 'ADMIN',
    },
  });
  console.log(`Admin ready: ${ADMIN_EMAIL}`);
}

main().finally(() => prisma.$disconnect());
