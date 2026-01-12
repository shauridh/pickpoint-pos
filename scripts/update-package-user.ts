// Script untuk update userId pada package tertentu berdasarkan nomor resi
// Jalankan dengan: npx tsx scripts/update-package-user.ts <receiptNumber> <newUserId>

import { prisma } from '../src/lib/prisma';

async function main() {
  const [,, receiptNumber, newUserId] = process.argv;
  if (!receiptNumber || !newUserId) {
    console.error('Usage: npx tsx scripts/update-package-user.ts <receiptNumber> <newUserId>');
    process.exit(1);
  }

  const pkg = await prisma.package.findUnique({ where: { receiptNumber } });
  if (!pkg) {
    console.error('Paket tidak ditemukan untuk resi:', receiptNumber);
    process.exit(1);
  }

  await prisma.package.update({
    where: { receiptNumber },
    data: { userId: newUserId },
  });

  console.log('Berhasil update userId untuk resi', receiptNumber, 'menjadi', newUserId);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
