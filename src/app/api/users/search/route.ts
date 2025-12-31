import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const formatLocationName = (slug: string | null) => {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug);
  return decoded
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const locationSlug = searchParams.get("location");
    const locationName = formatLocationName(locationSlug);

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          locationName
            ? { apartmentName: { equals: locationName, mode: "insensitive" } }
            : {},
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { unit: { contains: query, mode: "insensitive" } },
              { apartmentName: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        unit: true,
        apartmentName: true,
        phone: true,
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
