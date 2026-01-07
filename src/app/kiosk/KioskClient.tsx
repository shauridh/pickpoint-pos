"use client";

import { useState, useTransition, useEffect } from "react";
import { handoverPackage, markPackageAsPaidAction, destroyPackage } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PackageCheck,
  Loader2,
  ScanLine,
  CheckCircle2,
  XCircle,
  Clock,
  Crown,
  Package,
  User,
  MapPin,
  DollarSign,
} from "lucide-react";

type PackageItem = {
  id: string;
  receiptNumber: string;
  courierName: string;
  status: string;
  paymentStatus: string;
  basePrice: string;
  penaltyFee: string;
  userName: string;
  userPhone: string;
  userUnit: string;
  locationName: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  PENDING_PICKUP: "Menunggu Pickup",
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

export default function KioskClient({
  initialPackages,
}: {
  initialPackages: PackageItem[];
}) {
  const [packages, setPackages] = useState(initialPackages);
  const [receiptInput, setReceiptInput] = useState("");
  const [searchType, setSearchType] = useState<"resi" | "nama" | "unit" | "wa">("resi");
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/packages/recent");
        const data = await res.json();
        if (data.packages) {
          setPackages(data.packages);
        }
      } catch (error) {
        console.error("Refresh error:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Auto-search when QR scan completes (after 500ms of no input)
  useEffect(() => {
    if (!receiptInput.trim()) return;

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [receiptInput]);

  const handleSearch = async () => {
    setMessage(null);
    setSelectedPackage(null);

    const searchValue = receiptInput.trim().toLowerCase();

    if (!searchValue) {
      setMessage({ type: "error", text: "Masukkan kata kunci pencarian" });
      return;
    }

    let pkg: PackageItem | undefined;

    switch (searchType) {
      case "resi":
        pkg = packages.find((p) => p.receiptNumber.toLowerCase() === searchValue);
        break;
      case "nama":
        pkg = packages.find((p) => p.userName.toLowerCase().includes(searchValue));
        break;
      case "unit":
        pkg = packages.find((p) => p.userUnit.toLowerCase().includes(searchValue));
        break;
      case "wa":
        pkg = packages.find((p) => p.userPhone.includes(searchValue));
        break;
    }

    if (!pkg) {
      setMessage({ type: "error", text: "Paket tidak ditemukan" });
      return;
    }

    // Open dialog with package info
    setSelectedPackage(pkg);
    setDialogOpen(true);
  };

  const handleHandover = () => {
    if (!selectedPackage) return;

    setMessage(null);

    startTransition(async () => {
      const result = await handoverPackage(selectedPackage.receiptNumber);

      if (!result.success) {
        setMessage({ type: "error", text: result.message || "Gagal serahkan paket" });
        setDialogOpen(false);
        return;
      }

      setMessage({ type: "success", text: "✅ Paket berhasil diserahkan!" });
      setDialogOpen(false);
      setSelectedPackage(null);
      setReceiptInput("");

      // Update live feed
      if (result.package) {
        setPackages((prev) =>
          prev.map((p) => (p.id === result.package?.id ? (result.package as unknown as PackageItem) : p))
        );
      }

      // Auto clear success message
      setTimeout(() => setMessage(null), 5000);
    });
  };

  const handleMarkAsPaid = () => {
    if (!selectedPackage) return;

    setMessage(null);

    startTransition(async () => {
      const result = await markPackageAsPaidAction(selectedPackage.receiptNumber);

      if (!result.success) {
        setMessage({ type: "error", text: result.message || "Gagal menandai sudah dibayar" });
        return;
      }

      setMessage({ type: "success", text: "✅ Paket ditandai sudah dibayar!" });

      // Update live feed and selected package
      if (result.package) {
        setPackages((prev) =>
          prev.map((p) => (p.id === result.package?.id ? (result.package as unknown as PackageItem) : p))
        );
        setSelectedPackage(result.package as unknown as PackageItem);
      }

      // Auto clear success message
      setTimeout(() => setMessage(null), 5000);
    });
  };

  const handleDestroy = () => {
    if (!selectedPackage) return;

    if (!confirm("Apakah Anda yakin ingin memusnahkan paket ini? Paket yang dimusnahkan hanya untuk paket yang belum dibayar dan tidak diambil.")) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const result = await destroyPackage(selectedPackage.receiptNumber);

      if (!result.success) {
        setMessage({ type: "error", text: result.message || "Gagal memusnahkan paket" });
        setDialogOpen(false);
        return;
      }

      setMessage({ type: "success", text: "✅ Paket berhasil dimusnahkan!" });
      setDialogOpen(false);
      setSelectedPackage(null);
      setReceiptInput("");

      // Remove from live feed
      setPackages((prev) => prev.filter((p) => p.id !== selectedPackage.id));

      // Auto clear success message
      setTimeout(() => setMessage(null), 5000);
    });
  };

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

  const totalPrice = selectedPackage
    ? Number(selectedPackage.basePrice) + Number(selectedPackage.penaltyFee)
    : 0;

  const isPaid = selectedPackage?.paymentStatus === "PAID";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-2rem)]">

        {/* LEFT PANEL - Scan & Handover */}
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              <PackageCheck className="w-8 h-8" />
              Kiosk Pickup Station
            </h1>
            <p className="text-slate-400">Scan QR Code untuk ambil paket</p>
          </div>

          {/* Scan Section */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Select value={searchType} onValueChange={(val) => setSearchType(val as any)}>
                    <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="resi" className="text-white">Nomor Resi</SelectItem>
                      <SelectItem value="nama" className="text-white">Nama Penerima</SelectItem>
                      <SelectItem value="unit" className="text-white">Unit</SelectItem>
                      <SelectItem value="wa" className="text-white">No. WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                    <Input
                      placeholder={`Scan QR atau ketik ${searchType === 'resi' ? 'nomor resi' : searchType === 'nama' ? 'nama' : searchType === 'unit' ? 'unit' : 'nomor WA'}...`}
                      value={receiptInput}
                      onChange={(e) => setReceiptInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="bg-slate-900/50 border-slate-600 text-white text-xl h-16 pl-14 pr-6"
                      autoFocus
                    />
                    {receiptInput && !dialogOpen && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSearch}
                    size="lg"
                    disabled={isSubmitting}
                    className="h-16 px-6 text-lg bg-blue-600 hover:bg-blue-700"
                  >
                    <ScanLine className="w-6 h-6" />
                  </Button>
                </div>

                {/* Message Alert */}
                {message && (
                  <div
                    className={`rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === "success"
                        ? "bg-emerald-900/50 text-emerald-200 border border-emerald-700"
                        : "bg-red-900/50 text-red-200 border border-red-700"
                      }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                    <span className="font-medium text-lg">{message.text}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-blue-900/20 border-blue-700/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-blue-200">
                <ScanLine className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">Cara Menggunakan:</p>
                  <ul className="list-disc list-inside text-blue-300 space-y-1">
                    <li>Scan QR code (otomatis terbuka)</li>
                    <li>Atau ketik resi manual & tekan Enter/tombol Scan</li>
                    <li>Popup akan muncul dengan info paket</li>
                    <li>Cek pembayaran, lalu serahkan paket</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL - Live Feed */}
        <div>
          <Card className="bg-slate-800/30 border-slate-700 backdrop-blur h-full flex flex-col">
            <CardHeader className="border-b border-slate-700/50 flex-shrink-0">
              <div className="flex items-center justify-between text-white">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Paket Terbaru
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Live • {packages.length} paket
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <table className="w-full text-sm text-white">
                  <thead className="sticky top-0 bg-slate-800 border-b border-slate-700 z-10">
                    <tr className="text-left text-slate-400">
                      <th className="pb-3 pr-4 font-medium">Resi</th>
                      <th className="pb-3 pr-4 font-medium">Penerima</th>
                      <th className="pb-3 pr-4 font-medium">Unit</th>
                      <th className="pb-3 pr-4 font-medium">Lokasi</th>
                      <th className="pb-3 pr-4 font-medium">Kurir</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 font-medium">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          Belum ada paket hari ini
                        </td>
                      </tr>
                    ) : (
                      packages.map((pkg) => (
                        <tr
                          key={pkg.id}
                          className="border-b border-slate-700/50 hover:bg-slate-700/30 transition"
                        >
                          <td className="py-3 pr-4">
                            <div className="font-bold text-blue-300">{pkg.receiptNumber}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="font-medium">{pkg.userName}</div>
                            <div className="text-xs text-slate-500">{pkg.userPhone}</div>
                          </td>
                          <td className="py-3 pr-4 text-slate-300">{pkg.userUnit}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {pkg.locationName}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-slate-400">{pkg.courierName}</td>
                          <td className="py-3 pr-4">
                            <Badge
                              className={`text-xs ${statusColors[pkg.status] || "bg-slate-700 text-slate-200"
                                }`}
                            >
                              {statusLabels[pkg.status] || pkg.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-xs text-slate-500">
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
      </div>

      {/* Package Info Popup Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-400" />
              Informasi Paket
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Petugas, silakan cek dan ambil paket untuk diserahkan
            </DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="grid grid-cols-2 gap-4 py-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Receipt Number - Prominent */}
                <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700 text-center">
                  <div className="text-sm text-slate-400 mb-1">Nomor Resi</div>
                  <div className="text-2xl font-bold text-blue-300">
                    {selectedPackage.receiptNumber}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-2">
                    <User className="w-4 h-4" />
                    Penerima
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{selectedPackage.userName}</div>
                    <div className="text-sm text-slate-400">{selectedPackage.userPhone}</div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">
                      {selectedPackage.locationName} - Unit {selectedPackage.userUnit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Kurir: {selectedPackage.courierName}</span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Payment Info */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-2">
                    <DollarSign className="w-4 h-4" />
                    Detail Pembayaran
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Harga Dasar</span>
                    <span className="font-medium">{formatMoney(selectedPackage.basePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Denda</span>
                    <span className="font-medium">{formatMoney(selectedPackage.penaltyFee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold text-blue-400">
                      {formatMoney(String(totalPrice))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-slate-400">Status Bayar</span>
                    <Badge
                      variant={isPaid ? "default" : "secondary"}
                      className={isPaid ? "bg-emerald-600" : "bg-amber-600"}
                    >
                      {isPaid ? "✓ Lunas" : "⚠ Belum Bayar"}
                    </Badge>
                  </div>
                </div>

                {/* Warning if not paid */}
                {!isPaid && (
                  <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-amber-200 mb-1">
                        Pembayaran Belum Lunas
                      </div>
                      <div className="text-amber-300">
                        Minta customer melunasi pembayaran terlebih dahulu sebelum paket diserahkan.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
              className="border-slate-600 hover:bg-slate-700"
            >
              Batal
            </Button>

            {!isPaid && (
              <Button
                onClick={handleMarkAsPaid}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Proses...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Sudah Dibayar
                  </span>
                )}
              </Button>
            )}

            {!isPaid && selectedPackage?.status !== "COMPLETED" && (
              <Button
                onClick={handleDestroy}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Proses...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Musnahkan
                  </span>
                )}
              </Button>
            )}

            <Button
              onClick={handleHandover}
              disabled={isSubmitting || !isPaid}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5" />
                  Serahkan Paket
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
