"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

type SerializablePackage = {
  id: string;
  receiptNumber: string;
  courierName: string;
  userId: string;
  user: {
    id: string;
    name: string;
    phone: string;
    unit: string | null;
    apartmentName: string | null;
  };
  location: {
    id: number;
    name: string;
  };
  locationId: number;
  status: string;
  paymentStatus: string;
  proofPhotoUrl: string;
  basePrice: string;
  penaltyFee: string;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializePackage = (pkg: any): SerializablePackage => ({
  id: pkg.id,
  receiptNumber: pkg.receiptNumber,
  courierName: pkg.courierName,
  userId: pkg.userId,
  user: {
    id: pkg.user.id,
    name: pkg.user.name,
    phone: pkg.user.phone,
    unit: pkg.user.unit,
    apartmentName: pkg.user.apartmentName,
  },
  locationId: pkg.locationId,
  location: {
    id: pkg.location.id,
    name: pkg.location.name,
  },
  status: pkg.status,
  paymentStatus: pkg.paymentStatus,
  proofPhotoUrl: pkg.proofPhotoUrl,
  basePrice: String(pkg.basePrice),
  penaltyFee: String(pkg.penaltyFee),
  createdAt: pkg.createdAt instanceof Date ? pkg.createdAt.toISOString() : String(pkg.createdAt),
});

const toDecimal = (value: string | number) => {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return null;
  return num;
};

export async function quickCreateUser(input: {
  name: string;
  phone: string;
  unit: string;
  apartmentName: string;
}) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    if (!input.name || !input.phone || !input.unit || !input.apartmentName) {
      return { success: false, message: "Semua field harus diisi" };
    }

    const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existing) {
      return {
        success: false,
        message: "Nomor telepon sudah terdaftar",
      };
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        unit: input.unit,
        apartmentName: input.apartmentName,
        role: "CUSTOMER",
      },
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
    console.error("quickCreateUser error", error);
    return { success: false, message: "Gagal membuat user" };
  }
}

export async function createPackageByStaff(input: {
  courier: string;
  userId: string;
  receiptNumber: string;
  size?: string;
  photoUrl?: string;
  locationId: number;
  useCustomPrice?: boolean;
  customPrice?: string | number;
  bypassPhoto?: boolean;
}) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    const {
      courier,
      userId,
      receiptNumber,
      photoUrl,
      locationId,
      useCustomPrice,
      customPrice,
      bypassPhoto,
    } = input;

    if (!courier || !userId || !receiptNumber || !locationId) {
      return { success: false, message: "Courier, penerima, resi, dan lokasi wajib diisi" };
    }

    if (!photoUrl && !bypassPhoto) {
      return { success: false, message: "Foto wajib kecuali bypass diaktifkan" };
    }

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) {
      return { success: false, message: "Lokasi tidak ditemukan" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { apartmentName: true, id: true, name: true, phone: true, unit: true },
    });

    if (!user) {
      return { success: false, message: "User tidak ditemukan" };
    }

    if (user.apartmentName && user.apartmentName.toLowerCase() !== location.name.toLowerCase()) {
      return { success: false, message: "Lokasi penerima tidak sesuai dengan lokasi paket" };
    }

    const basePrice = useCustomPrice
      ? toDecimal(customPrice ?? "") ?? Number(location.price)
      : Number(location.price);

    const pkg = await prisma.package.create({
      data: {
        receiptNumber,
        courierName: courier,
        userId,
        locationId,
        status: "PENDING_PICKUP",
        proofPhotoUrl: photoUrl || "",
        basePrice,
        penaltyFee: 0,
        paymentStatus: "UNPAID",
      },
      include: {
        user: { select: { id: true, name: true, phone: true, unit: true, apartmentName: true } },
        location: { select: { id: true, name: true } },
      },
    });

    await revalidatePath("/admin/dashboard");
    return { success: true, package: serializePackage(pkg) };
  } catch (error) {
    console.error("createPackageByStaff error", error);
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === "P2002") {
      return { success: false, message: "Nomor resi sudah digunakan" };
    }
    return { success: false, message: "Gagal membuat paket" };
  }
}

export async function handoverPackage(receiptNumber: string) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    if (!receiptNumber) {
      return { success: false, message: "Masukkan nomor resi" };
    }

    const existing = await prisma.package.findUnique({
      where: { receiptNumber },
      include: {
        user: { select: { id: true, name: true, phone: true, unit: true, apartmentName: true } },
        location: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      return { success: false, message: "Paket tidak ditemukan" };
    }

    if (existing.paymentStatus === "UNPAID") {
      return { success: false, message: "Paket belum dibayar" };
    }

    if (existing.status === "COMPLETED") {
      return { success: true, message: "Paket sudah pernah diserahkan", package: serializePackage(existing) };
    }

    const updated = await prisma.package.update({
      where: { id: existing.id },
      data: { status: "COMPLETED" },
      include: {
        user: { select: { id: true, name: true, phone: true, unit: true, apartmentName: true } },
        location: { select: { id: true, name: true } },
      },
    });

    await revalidatePath("/admin/dashboard");
    return { success: true, package: serializePackage(updated) };
  } catch (error) {
    console.error("handoverPackage error", error);
    return { success: false, message: "Gagal menyerahkan paket" };
  }
}

export async function markPackageAsPaidAction(receiptNumber: string) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    if (!receiptNumber) {
      return { success: false, message: "Masukkan nomor resi" };
    }

    const existing = await prisma.package.findUnique({
      where: { receiptNumber },
      include: {
        user: { select: { id: true, name: true, phone: true, unit: true, apartmentName: true } },
        location: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      return { success: false, message: "Paket tidak ditemukan" };
    }

    if (existing.paymentStatus === "PAID") {
      return { success: true, message: "Paket sudah lunas", package: serializePackage(existing) };
    }

    const updated = await prisma.package.update({
      where: { id: existing.id },
      data: { paymentStatus: "PAID" },
      include: {
        user: { select: { id: true, name: true, phone: true, unit: true, apartmentName: true } },
        location: { select: { id: true, name: true } },
      },
    });

    await revalidatePath("/admin/dashboard");
    await revalidatePath("/kiosk");
    return { success: true, message: "Paket ditandai sudah dibayar", package: serializePackage(updated) };
  } catch (error) {
    console.error("markPackageAsPaidAction error", error);
    return { success: false, message: "Gagal menandai paket sebagai sudah dibayar" };
  }
}

export async function destroyPackage(receiptNumber: string) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    if (!receiptNumber) {
      return { success: false, message: "Masukkan nomor resi" };
    }

    const existing = await prisma.package.findUnique({
      where: { receiptNumber },
      include: {
        user: { select: { id: true, name: true, phone: true, unit: true, apartmentName: true } },
        location: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      return { success: false, message: "Paket tidak ditemukan" };
    }

    // Only allow destroy if unpaid and not completed
    if (existing.paymentStatus === "PAID") {
      return { success: false, message: "Paket yang sudah dibayar tidak bisa dimusnahkan" };
    }

    if (existing.status === "COMPLETED") {
      return { success: false, message: "Paket yang sudah diserahkan tidak bisa dimusnahkan" };
    }

    await prisma.package.delete({
      where: { id: existing.id },
    });

    await revalidatePath("/admin/dashboard");
    await revalidatePath("/kiosk");
    return { success: true, message: "Paket berhasil dimusnahkan" };
  } catch (error) {
    console.error("destroyPackage error", error);
    return { success: false, message: "Gagal memusnahkan paket" };
  }
}
