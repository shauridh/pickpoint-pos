"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function updateUserProfile(data: {
  name: string;
  phone: string;
  unit?: string;
  apartmentName?: string;
}) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return { success: false, message: "User tidak login" };
    }

    // Validate input
    if (!data.name || !data.phone || !data.unit || !data.apartmentName) {
      return { success: false, message: "Semua field harus diisi" };
    }

    // Check if phone number already taken by another user
    if (data.phone !== session.phone) {
      const existingUser = await prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existingUser) {
        return { success: false, message: "Nomor telepon sudah terdaftar" };
      }
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: data.name,
        phone: data.phone,
        unit: data.unit,
        apartmentName: data.apartmentName,
      },
    });

    return {
      success: true,
      message: "Profil berhasil diperbarui",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        unit: user.unit,
        apartmentName: user.apartmentName,
      },
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Gagal memperbarui profil" };
  }
}

export async function getUserProfile() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return { success: false, user: null };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        unit: true,
        apartmentName: true,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, user: null };
  }
}
