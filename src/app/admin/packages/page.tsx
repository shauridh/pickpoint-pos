import { prisma } from "@/lib/prisma";
import PackagesClient from "./PackagesClient";

// Force dynamic rendering - this page queries database
export const dynamic = 'force-dynamic';

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, phone: true, unit: true, apartmentName: true } },
      location: { select: { name: true } },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = packages.map((pkg: any) => ({
    id: pkg.id,
    receiptNumber: pkg.receiptNumber,
    courierName: pkg.courierName,
    status: pkg.status,
    paymentStatus: pkg.paymentStatus,
    basePrice: pkg.basePrice.toString(),
    penaltyFee: pkg.penaltyFee.toString(),
    proofPhotoUrl: pkg.proofPhotoUrl,
    userName: pkg.user.name,
    userPhone: pkg.user.phone,
    userUnit: pkg.user.unit || "-",
    userApartment: pkg.user.apartmentName || "-",
    locationName: pkg.location.name,
    createdAt: pkg.createdAt.toISOString(),
  }));

  return <PackagesClient packages={serialized} />;
}
