import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: {
        durationInDays: "asc",
      },
    });

    // Convert Decimal to string for JSON serialization
    return NextResponse.json(
      plans.map((plan) => ({
        ...plan,
        price: plan.price.toString(),
      }))
    );
  } catch (error) {
    console.error("Membership plans API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
