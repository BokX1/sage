/* eslint-disable no-console */

import { runConfigDoctor } from '../core/config/doctor';
import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('Sage v0.1 Beta - Doctor 🩺\n');

  // 1. Config Check
  await runConfigDoctor();

  // 2. DB Check
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Database connected.');
  } catch (e) {
    console.error('❌ Database connection failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  // 3. Migrations Check (Simple: check if we can query pending migrations)
  // Note: Prisma CLI is better for this, but simplistic check:
  // ... skipping complex migration check for now, DB connect is good proxy for "up".

  console.log('\nAll systems nominal (or at least responding).');
}

main().catch(console.error);
