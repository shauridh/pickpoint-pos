import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "STAFF"] },
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      locationId: true,
      location: {
        select: { id: true, name: true },
      },
      createdAt: true,
    },
  });

  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = users.map((u: any) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    role: u.role,
    locationId: u.locationId,
    locationName: u.location?.name || null,
    createdAt: u.createdAt.toISOString(),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedLocations = locations.map((loc: any) => ({ id: loc.id, name: loc.name }));

  return <UsersClient users={serialized} locations={serializedLocations} />;
}
