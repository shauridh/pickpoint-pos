import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packageId } = await request.json();

    if (!packageId) {
      return NextResponse.json({ error: "packageId is required" }, { status: 400 });
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        location: true,
      },
    });

    if (!pkg || pkg.userId !== session.userId) {
      return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
    }

    if (pkg.paymentStatus === "PAID") {
      const qrPayload = JSON.stringify({
        type: "pickup",
        packageId: pkg.id,
        receipt: pkg.receiptNumber,
        location: pkg.location.name,
      });
      return NextResponse.json({
        success: true,
        message: "Paket sudah dibayar",
        paymentStatus: pkg.paymentStatus,
        status: pkg.status,
        qrPayload,
      });
    }

    // Check if user is an active member
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isMember: true, memberExpiryDate: true },
    });

    const isMemberActive =
      user?.isMember &&
      user.memberExpiryDate &&
      new Date(user.memberExpiryDate) > new Date();

    const totalAmount = isMemberActive
      ? 0
      : Number(pkg.basePrice || 0) + Number(pkg.penaltyFee || 0) + Number(pkg.deliveryFee || 0);

    // Create a transaction record (simulated payment)
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.userId,
        type: "PACKAGE_FEE",
        amount: totalAmount,
        status: "PAID",
        relatedPackageId: pkg.id,
      },
    });

    // Mark package as paid and update status
    const updatedPackage = await prisma.package.update({
      where: { id: pkg.id },
      data: {
        paymentStatus: "PAID",
        status: "PAID",
      },
    });

    const qrPayload = JSON.stringify({
      type: "pickup",
      packageId: updatedPackage.id,
      receipt: updatedPackage.receiptNumber,
      location: pkg.location.name,
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentStatus: updatedPackage.paymentStatus,
      status: updatedPackage.status,
      qrPayload,
      isMemberFree: isMemberActive,
      amount: totalAmount,
    });
  } catch (error) {
    console.error("Package pay error", error);
    return NextResponse.json({ error: "Gagal memproses pembayaran" }, { status: 500 });
  }
}
