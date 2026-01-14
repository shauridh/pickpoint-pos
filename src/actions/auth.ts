"use server";

import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function loginUser(phone: string, pin: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { phone, role: "CUSTOMER" },
    });

    if (!user) {
      return { success: false, message: "User tidak ditemukan" };
    }

    // /login hanya untuk CUSTOMER, admin/staff wajib lewat /admin-login
    if (user.role === "ADMIN" || user.role === "STAFF") {
      return {
        success: false,
        message: "Silakan login via /admin-login untuk admin/staff",
      };
    }

    // For demo, allow any PIN that matches the hashed one
    // In production, implement proper PIN verification
    const pinMatch = user.pin ? await bcrypt.compare(pin, user.pin) : false;

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

export async function checkUserExists(phone: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { phone, role: "CUSTOMER" },
      select: { id: true, name: true, role: true, pin: true }
    });

    return {
      exists: !!user,
      isNewUser: !user,
      userName: user?.name,
      role: user?.role,
      hasPin: !!user?.pin,
    };
  } catch (error) {
    console.error("Check user error:", error);
    return { exists: false, isNewUser: true };
  }
}

export async function registerUser(data: {
  phone: string;
  name: string;
  pin: string;
  unit?: string;
  apartmentName?: string;
}) {
  try {
    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { phone: data.phone, role: "CUSTOMER" }
    });

    if (existing) {
      return { success: false, message: "Nomor HP sudah terdaftar" };
    }

    // Validate PIN (must be 6 digits)
    if (!/^\d{6}$/.test(data.pin)) {
      return { success: false, message: "PIN harus 6 digit angka" };
    }

    // Hash PIN
    const hashedPin = await bcrypt.hash(data.pin, 10);

    // Create user
    await prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        pin: hashedPin,
        unit: data.unit || "",
        apartmentName: data.apartmentName || "",
        role: "CUSTOMER"
      }
    });

    return {
      success: true,
      message: "Registrasi berhasil!",
      userId: undefined
    };
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, message: "Terjadi kesalahan saat registrasi" };
  }
}

export async function setCustomerPin(phone: string, pin: string) {
  try {
    // Validate PIN (must be 6 digits)
    if (!/^\d{6}$/.test(pin)) {
      return { success: false, message: "PIN harus 6 digit angka" };
    }

    const user = await prisma.user.findFirst({
      where: { phone, role: "CUSTOMER" },
    });

    if (!user) {
      return { success: false, message: "User tidak ditemukan" };
    }

    // Only allow setting PIN if not set
    if (user.pin) {
      return { success: false, message: "PIN sudah terdaftar, silakan login" };
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { pin: hashedPin },
    });

    return { success: true, message: "PIN berhasil dibuat" };
  } catch (error) {
    console.error("Set PIN error:", error);
    return { success: false, message: "Terjadi kesalahan" };
  }
}

export async function logoutUser() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("pickpoint_session");
  return { success: true };
}

export async function loginAdmin(username: string, password: string) {
  try {
    // Cari user dengan username dan role ADMIN/STAFF
    const user = await prisma.user.findFirst({
      where: {
        username,
        role: { in: ["ADMIN", "STAFF"] },
      },
    });
    if (!user) {
      return { success: false, message: "User admin/staff tidak ditemukan" };
    }
    // Cek password
    const passMatch = user.pin ? await bcrypt.compare(password, user.pin) : false;
    if (!passMatch) {
      return { success: false, message: "Password salah" };
    }
    await setSession({
      userId: user.id,
      phone: user.phone,
      name: user.name,
      isLoggedIn: true,
    });
    return { success: true, message: "Login admin/staff berhasil", userId: user.id };
  } catch (error) {
    console.error("Login admin error:", error);
    return { success: false, message: "Terjadi kesalahan" };
  }
}
