import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@builderplatform.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Demo user already exists, skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash('DemoPass123!', 12);
  const user = await prisma.user.create({
    data: { name: 'Demo Owner', email, passwordHash },
  });

  await prisma.websiteProject.create({
    data: {
      ownerId: user.id,
      name: 'Sample Restaurant',
      slug: 'sample-restaurant',
      category: 'Restaurant',
      description: 'A seeded example project for local development.',
      settings: { create: {} },
    },
  });

  console.log(`Seeded demo user: ${email} / DemoPass123!`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
