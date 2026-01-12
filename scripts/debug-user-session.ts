// Script untuk debug user session vs database
// Jalankan: npx tsx scripts/debug-user-session.ts <userId>

import { prisma } from '../src/lib/prisma';

async function main() {
  const [,, userId] = process.argv;
  if (!userId) {
    console.error('Usage: npx tsx scripts/debug-user-session.ts <userId>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error('User NOT FOUND in database for id:', userId);
    process.exit(1);
  }
  console.log('User found:', {
    id: user.id,
    name: user.name,
    phone: user.phone,
    isMember: user.isMember,
    memberExpiryDate: user.memberExpiryDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });

  const packages = await prisma.package.findMany({ where: { userId } });
  console.log('Total packages for this user:', packages.length);
  if (packages.length > 0) {
    console.log('Sample package:', {
      id: packages[0].id,
      receiptNumber: packages[0].receiptNumber,
      status: packages[0].status,
      createdAt: packages[0].createdAt,
    });
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
