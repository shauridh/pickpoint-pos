import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter required" },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { dropSlug: slug },
      select: {
        id: true,
        name: true,
        pricingScheme: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: location.id,
      name: location.name,
      pricingScheme: location.pricingScheme,
    });
  } catch (error) {
    console.error("Error fetching location scheme:", error);
    return NextResponse.json(
      { error: "Failed to fetch location scheme" },
      { status: 500 }
    );
  }
}
