"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function updatePushSubscription(
  subscription: PushSubscription
) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return { success: false, message: "User tidak login" };
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        pushSubscription: subscription as unknown as Prisma.InputJsonValue,
      },
    });

    return { success: true, message: "Subscription berhasil disimpan" };
  } catch (error) {
    console.error("Update subscription error:", error);
    return { success: false, message: "Gagal menyimpan subscription" };
  }
}

export async function createMembershipTransaction(planId: number) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return { success: false, message: "User tidak login" };
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return { success: false, message: "Plan tidak ditemukan" };
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.userId,
        type: "MEMBERSHIP_BUY",
        amount: plan.price,
        status: "PENDING",
        relatedPlanId: planId,
      },
    });

    return {
      success: true,
      message: "Transaksi dibuat",
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error("Create transaction error:", error);
    return { success: false, message: "Gagal membuat transaksi" };
  }
}

export async function simulatePaymentSuccess(transactionId: string) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return { success: false, message: "User tidak login" };
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return { success: false, message: "Transaksi tidak ditemukan" };
    }

    if (transaction.type !== "MEMBERSHIP_BUY") {
      return { success: false, message: "Tipe transaksi tidak sesuai" };
    }

    if (!transaction.relatedPlanId) {
      return { success: false, message: "Plan tidak ditemukan" };
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: transaction.relatedPlanId },
    });

    if (!plan) {
      return { success: false, message: "Plan tidak ditemukan" };
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "PAID" },
    });

    // Update user membership
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + plan.durationInDays);

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        isMember: true,
        memberExpiryDate: newExpiryDate,
      },
    });

    return {
      success: true,
      message: "Pembayaran sukses, Anda sekarang member aktif",
      expiryDate: user.memberExpiryDate,
    };
  } catch (error) {
    console.error("Payment simulation error:", error);
    return { success: false, message: "Gagal memproses pembayaran" };
  }
}
