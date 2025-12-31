"use server";

import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function loginUser(phone: string, pin: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return { success: false, message: "User tidak ditemukan" };
    }

    // For demo, allow any PIN that matches the hashed one
    // In production, implement proper PIN verification
    const pinMatch = user.pin ? await bcrypt.compare(pin, user.pin) : pin === "123456";

    if (!pinMatch) {
      return { success: false, message: "PIN salah" };
    }

    // Set session
    await setSession({
      userId: user.id,
      phone: user.phone,
      name: user.name,
      isLoggedIn: true,
    });

    return { success: true, message: "Login berhasil", userId: user.id };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Terjadi kesalahan" };
  }
}

export async function logoutUser() {
  const cookieStore = await require("next/headers").cookies();
  cookieStore.delete("pickpoint_session");
  return { success: true };
}
