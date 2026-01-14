"use server";

import { prisma } from "@/lib/prisma";
import { PricingScheme } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

export async function createCustomer(data: {
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

    if (!data.name || !data.phone || !data.unit || !data.apartmentName) {
      return { success: false, message: "Semua field harus diisi" };
    }

    // Format phone ke awalan 62
    const formatPhone = (value: string) => {
      let cleaned = value.replace(/\D/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "62" + cleaned.slice(1);
      }
      return cleaned;
    };
    const phone = formatPhone(data.phone);

    const existing = await prisma.user.findFirst({
      where: { phone, role: "CUSTOMER" },
    });

    if (existing) {
      return { success: false, message: "Nomor HP sudah terdaftar" };
    }

    const customer = await prisma.user.create({
      data: {
        name: data.name,
        phone,
        unit: data.unit,
        apartmentName: data.apartmentName,
        role: "CUSTOMER",
      },
    });

    revalidatePath("/admin/customers");
    return { success: true, customer: { id: customer.id, name: customer.name } };
  } catch (error) {
    console.error("Create customer error:", error);
    return { success: false, message: "Gagal membuat customer" };
  }
}

export async function updateCustomer(
  id: string,
  data: {
    name: string;
    phone: string;
    unit: string;
    apartmentName: string;
  }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    if (!data.name || !data.phone || !data.unit || !data.apartmentName) {
      return { success: false, message: "Semua field harus diisi" };
    }

    // Check if new phone already exists for another customer
    const existing = await prisma.user.findFirst({
      where: { phone: data.phone, role: "CUSTOMER", id: { not: id } },
    });

    if (existing) {
      return { success: false, message: "Nomor HP sudah digunakan customer lain" };
    }

    let updateData: any = {
      name: data.name,
      phone: data.phone,
      unit: data.unit,
      apartmentName: data.apartmentName,
    };
    // Jika ada field pin dan valid, hash dan update
    if (data.pin && /^\d{6}$/.test(data.pin)) {
      const bcrypt = require("bcryptjs");
      updateData.pin = await bcrypt.hash(data.pin, 10);
    }
    const customer = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/customers");
    return { success: true, customer: { id: customer.id, name: customer.name } };
  } catch (error) {
    console.error("Update customer error:", error);
    return { success: false, message: "Gagal update customer" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error) {
    console.error("Delete customer error:", error);
    return { success: false, message: "Gagal hapus customer" };
  }
}

export async function createLocation(data: {
  name: string;
  pricingScheme?: string;
  gracePeriodDays?: number;
  priceConfig?: any;
  deliveryEnabled?: boolean;
  deliveryPriceConfig?: any;
  price?: number; // Legacy support
}) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    if (!data.name) {
      return { success: false, message: "Nama lokasi harus diisi" };
    }

    const existing = await prisma.location.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return { success: false, message: "Nama lokasi sudah ada" };
    }

    // Auto-generate drop slug
    const dropSlug = generateSlug(data.name);
    const slugExists = await prisma.location.findUnique({
      where: { dropSlug },
    });

    if (slugExists) {
      return { success: false, message: "Slug lokasi sudah ada (cek nama lokasi)" };
    }

    // Default values for legacy support
    const pricingScheme = (data.pricingScheme as PricingScheme) || PricingScheme.FLAT;
    const gracePeriodDays = data.gracePeriodDays ?? 0;
    const priceConfig = data.priceConfig || { basePrice: data.price || 5000, penaltyPer24h: 3000 };
    const deliveryEnabled = data.deliveryEnabled ?? false;
    const deliveryPriceConfig = data.deliveryPriceConfig || { S: 5000, M: 7000, L: 10000, XL: 15000 };
    const legacyPrice = data.price || (priceConfig.basePrice || 5000);

    const location = await prisma.location.create({
      data: {
        name: data.name,
        dropSlug,
        price: legacyPrice,
        pricingScheme,
        gracePeriodDays,
        priceConfig,
        deliveryEnabled,
        deliveryPriceConfig,
      },
    });

    revalidatePath("/admin/locations");
    return { success: true, location: { id: location.id, name: location.name, dropSlug: location.dropSlug } };
  } catch (error) {
    console.error("Create location error:", error);
    return { success: false, message: "Gagal membuat lokasi" };
  }
}

export async function updateLocation(
  id: number,
  data: {
    name: string;
    pricingScheme?: string;
    gracePeriodDays?: number;
    priceConfig?: any;
    deliveryEnabled?: boolean;
    deliveryPriceConfig?: any;
    price?: number; // Legacy support
  }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    if (!data.name) {
      return { success: false, message: "Nama valid harus diisi" };
    }

    // Auto-generate drop slug if name changed
    const dropSlug = generateSlug(data.name);
    const current = await prisma.location.findUnique({ where: { id } });

    if (current && current.dropSlug !== dropSlug) {
      const slugExists = await prisma.location.findFirst({
        where: { dropSlug, NOT: { id } },
      });
      if (slugExists) {
        return { success: false, message: "Slug lokasi sudah ada" };
      }
    }

    // Default values
    const pricingScheme = (data.pricingScheme as PricingScheme) || PricingScheme.FLAT;
    const gracePeriodDays = data.gracePeriodDays ?? 0;
    const priceConfig = data.priceConfig || { basePrice: data.price || 5000, penaltyPer24h: 3000 };
    const deliveryEnabled = data.deliveryEnabled ?? false;
    const deliveryPriceConfig = data.deliveryPriceConfig || { S: 5000, M: 7000, L: 10000, XL: 15000 };
    const legacyPrice = data.price || (priceConfig.basePrice || 5000);

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: data.name,
        dropSlug,
        price: legacyPrice,
        pricingScheme,
        gracePeriodDays,
        priceConfig,
        deliveryEnabled,
        deliveryPriceConfig,
      },
    });

    revalidatePath("/admin/locations");
    return { success: true, location: { id: location.id, name: location.name, dropSlug: location.dropSlug } };
  } catch (error) {
    console.error("Update location error:", error);
    return { success: false, message: "Gagal update lokasi" };
  }
}

export async function deleteLocation(id: number) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    await prisma.location.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Delete location error:", error);
    return { success: false, message: "Gagal hapus lokasi" };
  }
}

export async function createStaffUser(data: {
  name: string;
  phone: string;
  role: "ADMIN" | "STAFF";
  pin: string;
  locationId?: number;
}) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    if (!data.name || !data.phone || !data.role || !data.pin) {
      return { success: false, message: "Semua field harus diisi" };
    }

    if (data.role === "STAFF" && !data.locationId) {
      return { success: false, message: "Lokasi wajib dipilih untuk staff" };
    }

    const existing = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      return { success: false, message: "Nomor HP sudah terdaftar" };
    }

    const bcrypt = require("bcryptjs");
    const hashedPin = await bcrypt.hash(data.pin, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        role: data.role,
        pin: hashedPin,
        ...(data.role === "STAFF" && data.locationId
          ? { locationId: data.locationId }
          : { locationId: null }),
      },
    });

    revalidatePath("/admin/users");
    return { success: true, user: { id: user.id, name: user.name } };
  } catch (error) {
    console.error("Create staff user error:", error);
    return { success: false, message: "Gagal membuat user" };
  }
}

export async function updateStaffUser(
  id: string,
  data: {
    name: string;
    phone: string;
    role: "ADMIN" | "STAFF";
    locationId?: number | null;
    pin?: string;
  }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    if (!data.name || !data.phone || !data.role) {
      return { success: false, message: "Semua field harus diisi" };
    }

    if (data.role === "STAFF" && !data.locationId) {
      return { success: false, message: "Lokasi wajib dipilih untuk staff" };
    }

    let hashedPin: string | undefined;
    if (data.pin) {
      const bcrypt = require("bcryptjs");
      hashedPin = await bcrypt.hash(data.pin, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        role: data.role,
        locationId: data.role === "STAFF" ? data.locationId || null : null,
        ...(hashedPin ? { pin: hashedPin } : {}),
      },
    });

    revalidatePath("/admin/users");
    return { success: true, user: { id: user.id, name: user.name } };
  } catch (error) {
    console.error("Update staff user error:", error);
    return { success: false, message: "Gagal update user" };
  }
}

export async function deleteStaffUser(id: string) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Delete staff user error:", error);
    return { success: false, message: "Gagal hapus user" };
  }
}

export async function updatePackageStatus(
  id: string,
  status: "PENDING_PICKUP" | "PAID" | "COMPLETED" | "RETURNED"
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    const pkg = await prisma.package.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/admin/packages");
    return { success: true };
  } catch (error) {
    console.error("Update package status error:", error);
    return { success: false, message: "Gagal update status" };
  }
}

export async function markPackageAsPaid(id: string) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return { success: false, message: "Unauthorized" };
    }
    const pkg = await prisma.package.update({
      where: { id },
      data: { paymentStatus: "PAID" },
    });

    revalidatePath("/admin/packages");
    return { success: true };
  } catch (error) {
    console.error("Mark as paid error:", error);
    return { success: false, message: "Gagal mark as paid" };
  }
}
