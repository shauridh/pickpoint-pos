import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
            select: { gracePeriodDays: true, priceConfig: true },
          });

          if (location) {
            const createdDate = new Date(pkg.createdAt);
            const now = new Date();
            const hoursPassed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
            const gracePeriodHours = (location.gracePeriodDays || 0) * 24;
            const penaltyPer24h = Number((location.priceConfig as any)?.penaltyPer24h || 0);

            let newPenaltyFeeNumber = 0;
            if (hoursPassed > gracePeriodHours && penaltyPer24h > 0) {
              const hoursOver = hoursPassed - gracePeriodHours;
              const daysOver = Math.floor(hoursOver / 24);
              newPenaltyFeeNumber = daysOver > 0 ? daysOver * penaltyPer24h : 0;
            }

            if (Number(pkg.penaltyFee) !== Number(newPenaltyFeeNumber)) {
              await prisma.package.update({
                where: { id: pkg.id },
                data: { penaltyFee: newPenaltyFeeNumber.toString() },
              });
              // reflect change in the object for response consistency
              pkg.penaltyFee = newPenaltyFeeNumber as unknown as typeof pkg.penaltyFee;
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
