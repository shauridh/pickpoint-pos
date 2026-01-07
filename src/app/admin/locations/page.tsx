import { prisma } from "@/lib/prisma";
import LocationsClient from "./LocationsClient";

export default async function AdminLocationsPage() {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = locations.map((loc: any) => ({
    id: loc.id,
    name: loc.name,
    dropSlug: loc.dropSlug,
    price: loc.price.toString(),
    pricingScheme: loc.pricingScheme as "FLAT" | "FLAT_SIZE" | "PROGRESSIVE_DAY" | "PROGRESSIVE_PACKAGE",
    gracePeriodDays: loc.gracePeriodDays,
    priceConfig: loc.priceConfig,
    deliveryEnabled: loc.deliveryEnabled,
    deliveryPriceConfig: loc.deliveryPriceConfig,
    createdAt: loc.createdAt.toISOString(),
  }));

  return <LocationsClient locations={serialized} />;
}
