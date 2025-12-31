"use client";

import { useState, useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, DollarSign } from "lucide-react";
import { updatePackageStatus, markPackageAsPaid } from "@/actions/crud";

type PackageItem = {
  id: string;
  receiptNumber: string;
  courierName: string;
  status: string;
  paymentStatus: string;
  basePrice: string;
  penaltyFee: string;
  proofPhotoUrl: string;
  userName: string;
  userPhone: string;
  userUnit: string;
  userApartment: string;
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

export default function PackagesClient({ packages }: { packages: PackageItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let result = packages;

    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.receiptNumber.toLowerCase().includes(q) ||
          p.userName.toLowerCase().includes(q) ||
          p.userPhone.includes(q) ||
          p.courierName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [packages, search, statusFilter]);

  const formatMoney = (value: string) => {
    const num = Number(value);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
    });

  const handleToggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((p) => p.id));
    }
  };

  const handleBulkStatusUpdate = () => {
    if (!bulkStatus || selected.length === 0) return;
    if (!confirm(`Ubah ${selected.length} paket ke status ${bulkStatus}?`)) return;

    startTransition(async () => {
      for (const id of selected) {
        await updatePackageStatus(id, bulkStatus as "PAID" | "PENDING_PICKUP" | "COMPLETED" | "RETURNED");
      }
      setSelected([]);
      setBulkStatus("");
      window.location.reload();
    });
  };

  const handleBulkMarkPaid = () => {
    if (selected.length === 0) return;
    if (!confirm(`Tandai ${selected.length} paket sebagai lunas?`)) return;

    startTransition(async () => {
      for (const id of selected) {
        await markPackageAsPaid(id);
      }
      setSelected([]);
      window.location.reload();
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Packages</h1>
        <p className="text-slate-600">Kelola semua paket masuk</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>Daftar Paket ({filtered.length})</CardTitle>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Cari resi, nama, HP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING_PICKUP">Menunggu</option>
                  <option value="PAID">Lunas</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="RETURNED">Retur</option>
                </select>
              </div>
            </div>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-900">
                  {selected.length} dipilih
                </span>
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue placeholder="Ubah status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING_PICKUP">Menunggu</SelectItem>
                    <SelectItem value="PAID">Lunas</SelectItem>
                    <SelectItem value="COMPLETED">Selesai</SelectItem>
                    <SelectItem value="RETURNED">Retur</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkStatus || isPending}
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Terapkan"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkMarkPaid}
                  disabled={isPending}
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  Tandai Lunas
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected([])}
                >
                  Batal
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="pb-3 pr-2 font-medium">
                    <input
                      type="checkbox"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={handleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="pb-3 pr-4 font-medium">Resi</th>
                  <th className="pb-3 pr-4 font-medium">Penerima</th>
                  <th className="pb-3 pr-4 font-medium">Kurir</th>
                  <th className="pb-3 pr-4 font-medium">Lokasi</th>
                  <th className="pb-3 pr-4 font-medium">Harga</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filtered.map((pkg) => (
                    <tr key={pkg.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          checked={selected.includes(pkg.id)}
                          onChange={() => handleToggleSelect(pkg.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {pkg.receiptNumber}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">{pkg.userName}</div>
                        <div className="text-xs text-slate-500">
                          {pkg.userApartment} {pkg.userUnit}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{pkg.courierName}</td>
                      <td className="py-3 pr-4 text-slate-700">{pkg.locationName}</td>
                      <td className="py-3 pr-4 text-slate-700">
                        {formatMoney(pkg.basePrice)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={`${
                            statusColors[pkg.status] || "bg-slate-200 text-slate-800"
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
