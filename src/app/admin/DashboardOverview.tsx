"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TrendingUp, 
  Users, 
  MapPin,
  Clock,
  DollarSign
} from "lucide-react";

type Stats = {
  totalPackages: number;
  pendingPackages: number;
  todayPackages: number;
  totalRevenue: number;
  totalCustomers: number;
  totalLocations: number;
};

type PackageItem = {
  id: string;
  receiptNumber: string;
  courierName: string;
  status: string;
  paymentStatus: string;
  userName: string;
  userPhone: string;
  userUnit: string;
  locationName: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  PENDING_PICKUP: "Menunggu",
  PAID: "Lunas",
  COMPLETED: "Selesai",
  RETURNED: "Retur",
};

const statusColors: Record<string, string> = {
  PENDING_PICKUP: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  RETURNED: "bg-slate-200 text-slate-800",
};

export default function DashboardOverview({
  stats,
  recentPackages,
}: {
  stats: Stats;
  recentPackages: PackageItem[];
}) {
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Ringkasan sistem PickPoint</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Paket
            </CardTitle>
            <Package className="w-5 h-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPackages}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.pendingPackages} menunggu pickup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Paket Hari Ini
            </CardTitle>
            <Clock className="w-5 h-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayPackages}</div>
            <p className="text-xs text-slate-500 mt-1">Paket masuk hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-5 h-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(stats.totalRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Dari paket yang sudah lunas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Customer
            </CardTitle>
            <Users className="w-5 h-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-slate-500 mt-1">Pengguna terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Lokasi Aktif
            </CardTitle>
            <MapPin className="w-5 h-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLocations}</div>
            <p className="text-xs text-slate-500 mt-1">Lokasi/rak tersedia</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <TrendingUp className="w-5 h-5" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <a href="/admin/packages" className="block hover:underline">
                → Kelola Paket
              </a>
              <a href="/admin/customers" className="block hover:underline">
                → Kelola Customer
              </a>
              <a href="/kiosk" className="block hover:underline">
                → Buka POS Kiosk
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Paket Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="pb-3 pr-4 font-medium">Resi</th>
                  <th className="pb-3 pr-4 font-medium">Penerima</th>
                  <th className="pb-3 pr-4 font-medium">Kurir</th>
                  <th className="pb-3 pr-4 font-medium">Lokasi</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentPackages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada paket
                    </td>
                  </tr>
                ) : (
                  recentPackages.map((pkg) => (
                    <tr key={pkg.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {pkg.receiptNumber}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">
                          {pkg.userName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {pkg.userUnit} • {pkg.userPhone}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {pkg.courierName}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {pkg.locationName}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={`${
                            statusColors[pkg.status] ||
                            "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {statusLabels[pkg.status] || pkg.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-600 text-xs">
                        {formatDate(pkg.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
