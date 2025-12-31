import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/midtrans";
import { notifyPaymentSuccess } from "@/lib/webpush";
import { notifyPaymentSuccessWhatsApp } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
    } = body;

    console.log("Midtrans webhook received:", {
      order_id,
      transaction_status,
      fraud_status,
    });

    // Verify signature
    const isValid = verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValid) {
      console.error("Invalid Midtrans signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    // Get transaction from database
    const transaction = await prisma.transaction.findUnique({
      where: { id: order_id },
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
            id: true,
            receiptNumber: true,
          },
        },
        membershipPlan: {
          select: {
            durationInDays: true,
          },
        },
      },
    });

    if (!transaction) {
      console.error(`Transaction ${order_id} not found`);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Handle payment status
    let shouldUpdate = false;

    if (transaction_status === "capture") {
      if (fraud_status === "accept") {
        shouldUpdate = true;
      }
    } else if (transaction_status === "settlement") {
      shouldUpdate = true;
    } else if (transaction_status === "cancel" || transaction_status === "deny" || transaction_status === "expire") {
      // Update transaction to FAILED
      await prisma.transaction.update({
        where: { id: order_id },
        data: { status: "FAILED" },
      });
      
      return NextResponse.json({
        success: true,
        message: "Transaction marked as failed",
      });
    }

    if (shouldUpdate && transaction.status !== "PAID") {
      // Update transaction status to PAID
      await prisma.transaction.update({
        where: { id: order_id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // Handle based on transaction type
      if (transaction.type === "PACKAGE_FEE" && transaction.packageId) {
        // Update package payment status
        await prisma.package.update({
          where: { id: transaction.packageId },
          data: {
            paymentStatus: "PAID",
            status: "PAID",
          },
        });

        console.log(`Package ${transaction.package?.receiptNumber} marked as paid`);

        // Send notification
        try {
          await Promise.all([
            notifyPaymentSuccess(
              transaction.userId,
              Number(transaction.amount),
              "package"
            ),
            notifyPaymentSuccessWhatsApp(
              transaction.user.phone,
              transaction.user.name,
              Number(transaction.amount),
              "package"
            ),
          ]);
        } catch (error) {
          console.error("Failed to send payment notification:", error);
        }
      } else if (transaction.type === "MEMBERSHIP_BUY" && transaction.membershipPlanId) {
        // Update user membership
        const currentUser = await prisma.user.findUnique({
          where: { id: transaction.userId },
          select: { memberExpiryDate: true },
        });

        const now = new Date();
        const baseDate = currentUser?.memberExpiryDate && currentUser.memberExpiryDate > now
          ? currentUser.memberExpiryDate
          : now;

        const newExpiryDate = new Date(baseDate);
        newExpiryDate.setDate(newExpiryDate.getDate() + (transaction.membershipPlan?.durationInDays || 30));

        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            isMember: true,
            memberExpiryDate: newExpiryDate,
          },
        });

        console.log(`User ${transaction.user.name} membership extended to ${newExpiryDate}`);

        // Send notification
        try {
          await Promise.all([
            notifyPaymentSuccess(
              transaction.userId,
              Number(transaction.amount),
              "membership"
            ),
            notifyPaymentSuccessWhatsApp(
              transaction.user.phone,
              transaction.user.name,
              Number(transaction.amount),
              "membership"
            ),
          ]);
        } catch (error) {
          console.error("Failed to send payment notification:", error);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Payment processed successfully",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    console.error("Midtrans webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
