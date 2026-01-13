import { prisma } from "@/lib/prisma";
import CustomersClient from "./CustomersClient";

// Force dynamic rendering - this page queries database
export const dynamic = 'force-dynamic';

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = customers.map((c: any) => ({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedLocations = locations.map((l: any) => ({ id: l.id, name: l.name }));

  return <CustomersClient customers={serialized} locations={serializedLocations} />;
}
