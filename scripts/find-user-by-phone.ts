// Script untuk mencari userId berdasarkan nomor WhatsApp (phone)
// Jalankan: npx tsx scripts/find-user-by-phone.ts <phone>

import { prisma } from '../src/lib/prisma';

async function main() {
  const [,, phone] = process.argv;
  if (!phone) {
    console.error('Usage: npx tsx scripts/find-user-by-phone.ts <phone>');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user) {
    console.error('User NOT FOUND for phone:', phone);
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
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
