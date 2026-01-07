import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, phone: true, unit: true } },
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
      userName: pkg.user.name,
      userPhone: pkg.user.phone,
      userUnit: pkg.user.unit || "-",
      locationName: pkg.location.name,
      createdAt: pkg.createdAt.toISOString(),
    }));

    return NextResponse.json({ packages: serialized });
  } catch (error) {
    console.error("Get recent packages error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
