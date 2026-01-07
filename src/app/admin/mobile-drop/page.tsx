import MobileDropClient from "./MobileDropClient";
import { prisma } from "@/lib/prisma";

type LocationRecord = { id: number; name: string; price: any };

export default async function AdminMobileDropPage() {
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });
  const serializedLocations = locations.map((loc: LocationRecord) => ({
    id: loc.id,
    name: loc.name,
    price: loc.price.toString(),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">Staff Mobile Kiosk</p>
          <h1 className="text-3xl font-semibold text-slate-900">Mobile Drop</h1>
          <p className="text-sm text-slate-500">Mode khusus petugas dengan quick add, override harga, dan bypass foto.</p>
        </div>
        <MobileDropClient locations={serializedLocations} />
      </div>
    </div>
  );
}
