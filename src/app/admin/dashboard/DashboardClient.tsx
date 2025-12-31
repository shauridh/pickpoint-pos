"use client";

import { useMemo, useState, useTransition } from "react";
import { handoverPackage } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, PackageSearch, PackageCheck, Users, MapPin, ShieldCheck } from "lucide-react";

export type PackageRow = {
  id: string;
  receiptNumber: string;
  courierName: string;
  status: string;
  paymentStatus: string;
  proofPhotoUrl: string;
  basePrice: string;
  penaltyFee: string;
  createdAt: string;
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
};

export type Stats = {
  totalPackages: number;
  pendingCount: number;
  paidCount: number;
  unpaidCount: number;
  locationsCount: number;
  usersCount: number;
};

const statusLabels: Record<string, string> = {
  PENDING_PICKUP: "Menunggu", 
  PAID: "Lunas", 
  COMPLETED: "Selesai", 
  RETURNED: "Retur",
};

const paymentLabels: Record<string, string> = {
  UNPAID: "Belum Bayar",
  PAID: "Sudah Bayar",
};

const statusColors: Record<string, string> = {
  PENDING_PICKUP: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  RETURNED: "bg-slate-200 text-slate-800",
};

export default function DashboardClient({ packages, stats }: { packages: PackageRow[]; stats: Stats }) {
  const [rows, setRows] = useState<PackageRow[]>(packages);
  const [filter, setFilter] = useState<string>("ALL");
  const [handoverReceipt, setHandoverReceipt] = useState("");
  const [handoverMessage, setHandoverMessage] = useState<string | null>(null);
  const [handoverError, setHandoverError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "ALL") return rows;
    return rows.filter((pkg) => pkg.status === filter);
  }, [filter, rows]);

  const handleHandover = () => {
    setHandoverError(null);
    setHandoverMessage(null);

    const receipt = handoverReceipt.trim();
    if (!receipt) {
      setHandoverError("Masukkan nomor resi");
      return;
    }

    startTransition(async () => {
      const result = await handoverPackage(receipt);
      if (!result.success) {
        setHandoverError(result.message || "Gagal menyerahkan paket");
        return;
      }

      if (result.package) {
        setRows((prev) => {
          const exists = prev.find((p) => p.id === result.package?.id);
          if (exists) {
            return prev.map((p) => (p.id === result.package?.id ? (result.package as PackageRow) : p));
          }
          return [result.package as PackageRow, ...prev].slice(0, 50);
        });
      }

      setHandoverMessage(result.message || "Paket diserahkan");
      setHandoverReceipt("");
    });
  };

  const formatMoney = (value: string) => {
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(number);
  };

  const formatDate = (value: string) => new Date(value).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paket</CardTitle>
            <PackageSearch className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPackages}</div>
            <p className="text-xs text-slate-500">Menunggu: {stats.pendingCount} • Belum bayar: {stats.unpaidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran</CardTitle>
            <ShieldCheck className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidCount}</div>
            <p className="text-xs text-slate-500">Sudah bayar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User & Lokasi</CardTitle>
            <MapPin className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locationsCount} lokasi</div>
            <p className="text-xs text-slate-500">{stats.usersCount} pengguna</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Daftar Paket</CardTitle>
              <p className="text-sm text-slate-500">Filter status untuk fokus ke antrean tertentu.</p>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white shadow-sm"
            >
              <option value="ALL">Semua status</option>
              <option value="PENDING_PICKUP">Menunggu</option>
              <option value="PAID">Lunas</option>
              <option value="COMPLETED">Selesai</option>
              <option value="RETURNED">Retur</option>
            </select>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-4">Resi</th>
                  <th className="py-2 pr-4">Penerima</th>
                  <th className="py-2 pr-4">Kurir</th>
                  <th className="py-2 pr-4">Lokasi</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Bayar</th>
                  <th className="py-2">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td className="py-4 text-center text-slate-400" colSpan={7}>
                      Tidak ada data
                    </td>
                  </tr>
                )}
                {filtered.map((pkg) => (
                  <tr key={pkg.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium text-slate-900">{pkg.receiptNumber}</td>
                    <td className="py-2 pr-4 text-slate-700">
                      <div className="font-medium">{pkg.user.name}</div>
                      <div className="text-xs text-slate-500">{pkg.user.phone}</div>
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{pkg.courierName}</td>
                    <td className="py-2 pr-4 text-slate-700">{pkg.location.name}</td>
                    <td className="py-2 pr-4">
                      <Badge className={`${statusColors[pkg.status] || "bg-slate-200 text-slate-800"}`}>
                        {statusLabels[pkg.status] || pkg.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={pkg.paymentStatus === "PAID" ? "default" : "secondary"}>
                        {paymentLabels[pkg.paymentStatus] || pkg.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-2 text-slate-700">{formatDate(pkg.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Handover</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Scan atau cari nomor resi, cek status bayar, lalu serahkan.</p>
            <Input
              placeholder="Masukkan nomor resi"
              value={handoverReceipt}
              onChange={(e) => setHandoverReceipt(e.target.value)}
            />
            <Button onClick={handleHandover} disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Memproses</span>
              ) : (
                <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4" /> Serahkan Paket</span>
              )}
            </Button>
            {handoverMessage && (
              <div className="text-sm text-emerald-600 flex items-center gap-2">
                <PackageCheck className="h-4 w-4" /> {handoverMessage}
              </div>
            )}
            {handoverError && (
              <div className="text-sm text-red-600 flex items-center gap-2">
                <PackageSearch className="h-4 w-4" /> {handoverError}
              </div>
            )}
            <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Payment harus PAID sebelum serah.</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Pastikan lokasi sesuai saat serah terima.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manajemen User & Lokasi</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
          <div className="rounded-lg border p-4 bg-white shadow-sm">
            <div className="font-semibold mb-1">User</div>
            <p className="text-slate-600 mb-3">Lihat data penghuni, edit unit, atau tambah dari form drop.</p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/admin/mobile-drop">Quick Add via Mobile</a>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border p-4 bg-white shadow-sm">
            <div className="font-semibold mb-1">Lokasi</div>
            <p className="text-slate-600 mb-3">Pastikan setiap lokasi punya QR/link ke /drop/[slug] dan harga rak terbaru.</p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/admin/mobile-drop">Buat QR Drop</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
