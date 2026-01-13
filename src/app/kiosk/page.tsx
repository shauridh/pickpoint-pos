import { prisma } from "@/lib/prisma";
import KioskClient from "./KioskClient";

// Force dynamic rendering - this page queries database
export const dynamic = 'force-dynamic';

export default async function KioskPage() {
  const recentPackages = await prisma.package.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true, unit: true } },
      location: { select: { name: true } },
    },
  });

  const serialized = recentPackages.map((pkg: typeof recentPackages[number]) => ({
    id: pkg.id,
    receiptNumber: pkg.receiptNumber,
    courierName: pkg.courierName,
    status: pkg.status,
    paymentStatus: pkg.paymentStatus,
    basePrice: pkg.basePrice.toString(),
    penaltyFee: pkg.penaltyFee.toString(),
    userName: pkg.user.name,
    userPhone: pkg.user.phone,
    userUnit: pkg.user.unit || "-",
    locationName: pkg.location.name,
    createdAt: pkg.createdAt.toISOString(),
  }));

  return <KioskClient initialPackages={serialized} />;
}
