import { prisma } from "@/lib/prisma";
import DashboardOverview from "./DashboardOverview";

export default async function AdminHomePage() {
  const [
    totalPackages,
    pendingPackages,
    todayPackages,
    totalRevenue,
    totalCustomers,
    totalLocations,
    recentPackages,
  ] = await Promise.all([
    prisma.package.count(),
    prisma.package.count({ where: { status: "PENDING_PICKUP" } }),
    prisma.package.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.package.aggregate({
      _sum: { basePrice: true, penaltyFee: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.location.count(),
    prisma.package.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, phone: true, unit: true } },
        location: { select: { name: true } },
      },
    }),
  ]);

  const revenue = (
    Number(totalRevenue._sum.basePrice || 0) +
    Number(totalRevenue._sum.penaltyFee || 0)
  );

  const stats = {
    totalPackages,
    pendingPackages,
    todayPackages,
    totalRevenue: revenue,
    totalCustomers,
    totalLocations,
  };

  const packages = recentPackages.map((pkg) => ({
    id: pkg.id,
    receiptNumber: pkg.receiptNumber,
    courierName: pkg.courierName,
    status: pkg.status,
    paymentStatus: pkg.paymentStatus,
    userName: pkg.user.name,
    userPhone: pkg.user.phone,
    userUnit: pkg.user.unit || "-",
    locationName: pkg.location.name,
    createdAt: pkg.createdAt.toISOString(),
  }));

  return <DashboardOverview stats={stats} recentPackages={packages} />;
}
