import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSnapToken } from "@/lib/midtrans";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID required" },
        { status: 400 }
      );
    }

    // Get transaction with related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        package: {
          select: {
            receiptNumber: true,
          },
        },
        membershipPlan: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.status === "PAID") {
      return NextResponse.json(
        { error: "Transaction already paid" },
        { status: 400 }
      );
    }

    // Prepare item details based on transaction type
    const itemDetails = [];
    let itemName = "";

    if (transaction.type === "PACKAGE_FEE") {
      itemName = `Biaya Paket - ${transaction.package?.receiptNumber || "Unknown"}`;
      itemDetails.push({
        id: `PKG-${transaction.packageId}`,
        name: itemName,
        price: Number(transaction.amount),
        quantity: 1,
      });
    } else if (transaction.type === "MEMBERSHIP_BUY") {
      itemName = `Membership - ${transaction.membershipPlan?.name || "Plan"}`;
      itemDetails.push({
        id: `MBR-${transaction.membershipPlanId}`,
        name: itemName,
        price: Number(transaction.amount),
        quantity: 1,
      });
    }

    // Generate Snap token
    const token = await generateSnapToken({
      orderId: transaction.id,
      grossAmount: Number(transaction.amount),
      customerDetails: {
        firstName: transaction.user.name,
        phone: transaction.user.phone,
      },
      itemDetails,
    });

    return NextResponse.json({
      success: true,
      token,
      orderId: transaction.id,
    });
  } catch (error) {
    console.error("Error generating payment token:", error);
    return NextResponse.json(
      { error: "Failed to generate payment token" },
      { status: 500 }
    );
  }
}
