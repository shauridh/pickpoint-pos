import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const pendingPackages = await prisma.package.findMany({
      where: {
        userId: session.userId,
        status: {
          in: ["PENDING_PICKUP", "PAID"],
        },
      },
      include: {
        location: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate penalty fee for pending packages
    const packagesWithPenalty = await Promise.all(
      pendingPackages.map(async (pkg) => {
        // Only calculate penalty if not yet paid
        if (pkg.paymentStatus !== "PAID") {
          const location = await prisma.location.findUnique({
            where: { id: pkg.locationId },
            select: { gracePeriodDays: true, priceConfig: true, pricingScheme: true },
          }) as any;

          if (location) {
            const createdDate = new Date(pkg.createdAt);
            const now = new Date();
            const hoursPassed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
            const gracePeriodHours = (location.gracePeriodDays || 1) * 24;

            if (hoursPassed > gracePeriodHours) {
              // Calculate penalty
              let newPenaltyFee = 0;
              if (location.pricingScheme === "FLAT") {
                newPenaltyFee = location.priceConfig.penaltyPer24h || 0;
              } else if (location.pricingScheme === "FLAT_SIZE") {
                const size = pkg.size as string;
                newPenaltyFee = location.priceConfig[size]?.penalty || 0;
              }
              // Add other schemes as needed, but for now focusing on fixing the crash

              // Update package if penalty changed
              if (Number(pkg.penaltyFee) !== Number(newPenaltyFee)) {
                await prisma.package.update({
                  where: { id: pkg.id },
                  data: { penaltyFee: newPenaltyFee },
                });
                pkg.penaltyFee = new Prisma.Decimal(newPenaltyFee);
              }
            }
          }
        }
        return pkg;
      })
    );

    const completedPackages = await prisma.package.findMany({
      where: {
        userId: session.userId,
        status: "COMPLETED",
      },
      include: {
        location: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        isMember: user.isMember,
        memberExpiryDate: user.memberExpiryDate,
      },
      pendingPackages: packagesWithPenalty,
      completedPackages,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
