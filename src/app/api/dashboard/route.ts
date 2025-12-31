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
      pendingPackages,
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
