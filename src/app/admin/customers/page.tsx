import { prisma } from "@/lib/prisma";
import CustomersClient from "./CustomersClient";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      unit: true,
      apartmentName: true,
      isMember: true,
      memberExpiryDate: true,
      createdAt: true,
    },
  });

  const serialized = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    unit: c.unit || "-",
    apartmentName: c.apartmentName || "",
    isMember: c.isMember,
    memberExpiryDate: c.memberExpiryDate?.toISOString() || null,
    createdAt: c.createdAt.toISOString(),
  }));

  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const serializedLocations = locations.map((l) => ({ id: l.id, name: l.name }));

  return <CustomersClient customers={serialized} locations={serializedLocations} />;
}
