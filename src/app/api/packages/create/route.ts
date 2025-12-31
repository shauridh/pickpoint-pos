import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyPackageArrival } from "@/lib/webpush";
import { notifyPackageArrivalWhatsApp } from "@/lib/whatsapp";

const formatLocationName = (slug?: string) => {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug);
  return decoded
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courier, userId, receiptNumber, size, photoUrl, locationSlug } = body;

    // Validate required fields (size optional per requirement)
    if (!courier || !userId || !receiptNumber || !photoUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const locationName = formatLocationName(locationSlug);
    if (!locationName) {
      return NextResponse.json({ error: "Lokasi tidak valid" }, { status: 400 });
    }

    // Get location by slug/name
    const location = await prisma.location.findFirst({
      where: { name: { equals: locationName, mode: "insensitive" } },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Lokasi tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate user belongs to this location
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { apartmentName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (!user.apartmentName || user.apartmentName.toLowerCase() !== location.name.toLowerCase()) {
      return NextResponse.json({ error: "Lokasi penerima tidak sesuai" }, { status: 400 });
    }

    // Calculate base price from location
    const basePrice = location.price;

    // Create package
    const pkg = await prisma.package.create({
      data: {
        receiptNumber,
        courierName: courier,
        userId,
        locationId: location.id,
        status: "PENDING_PICKUP",
        proofPhotoUrl: photoUrl,
        basePrice: basePrice,
        penaltyFee: 0,
        paymentStatus: "UNPAID",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            pushSubscription: true,
          },
        },
      },
    });

    // Send push notification to user
    try {
      await notifyPackageArrival(userId, receiptNumber, location.name);
    } catch (error) {
      console.error("Failed to send push notification:", error);
      // Don't fail the request if notification fails
    }

    // Send WhatsApp notification
    try {
      await notifyPackageArrivalWhatsApp(
        pkg.user.phone,
        pkg.user.name,
        receiptNumber,
        location.name
      );
    } catch (error) {
      console.error("Failed to send WhatsApp notification:", error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    console.error("Package creation error:", error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
