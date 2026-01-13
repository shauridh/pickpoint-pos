"use client";

import { useEffect, useState } from "react";
import { useRef } from "react";
import { getSessionFromClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePushNotification } from "@/hooks/usePushNotification";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, User, Crown, Calendar, Image, Loader2, QrCode, CheckCircle2 } from "lucide-react";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

interface PackageWithPayment {
  id: string;
  receiptNumber: string;
  courierName: string;
  location: { id: number; name: string };
  proofPhotoUrl?: string;
  basePrice: number;
  penaltyFee: number;
  paymentStatus: string;
  createdAt: string;
}

interface DashboardData {
  user: any;
  pendingPackages: any[];
  completedPackages: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [bubbleStyle, setBubbleStyle] = useState<{ top: number; left: number } | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ packageId: string; package: PackageWithPayment } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [qrModal, setQrModal] = useState<{ qrPayload: string; receiptNumber: string; isFree: boolean } | null>(null);
  const pendingRef = useRef<HTMLButtonElement | null>(null);
  const completedRef = useRef<HTMLButtonElement | null>(null);
  const crownRef = useRef<HTMLButtonElement | null>(null);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const profileRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const { requestNotificationPermission, isLoading: notifLoading } =
    usePushNotification();

  const tourSteps = [
    {
      title: "Sapaan & profil",
      description: "Lihat sapaan cepat di header dan buka profil untuk ubah data diri.",
      anchor: "pending",
    },
    {
      title: "Icon mahkota",
      description:
        "Klik mahkota untuk cek status langganan atau perpanjang langsung.",
      anchor: "completed",
    },
    {
      title: "Notifikasi",
      description: "Aktifkan tombol bel untuk dapat push notifikasi paket baru.",
      anchor: "member",
    },
    {
      title: "Paket kamu",
      description: "Pantau paket di tab Menunggu atau Selesai.",
      anchor: "notif",
    },
    {
      title: "Profil",
      description: "Buka profil untuk ubah data dan logout.",
      anchor: "profile",
    },
  ];

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // Check session first
        const session = await getSessionFromClient();
        if (!session.userId) {
          router.push("/login");
          return;
        }

        // Fetch user & packages
        const response = await fetch("/api/dashboard");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Load dashboard error:", error);
      } finally {
        setIsCheckingAuth(false);
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  useEffect(() => {
    if (!isLoading && data) {
      const seen = localStorage.getItem("hasSeenDashboardTour");
      if (!seen) {
        setIsTourOpen(true);
      }
    }
  }, [isLoading, data]);

  useEffect(() => {
    if (!isTourOpen) return;
    const currentAnchor = tourSteps[tourStep]?.anchor;
    const refMap: Record<string, React.RefObject<HTMLElement>> = {
      pending: pendingRef as React.RefObject<HTMLElement>,
      completed: completedRef as React.RefObject<HTMLElement>,
      member: crownRef as React.RefObject<HTMLElement>,
      notif: bellRef as React.RefObject<HTMLElement>,
      profile: profileRef as React.RefObject<HTMLElement>,
    };

    const anchorRef = refMap[currentAnchor];
    if (!anchorRef?.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const top = rect.bottom + 10 + window.scrollY;
    const left = rect.left + rect.width / 2;
    setBubbleStyle({ top, left });
  }, [isTourOpen, tourStep]);

  const finishTour = () => {
    localStorage.setItem("hasSeenDashboardTour", "true");
    setIsTourOpen(false);
    setTourStep(0);
    setBubbleStyle(null);
  };

  const nextTour = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep((prev) => prev + 1);
    } else {
      finishTour();
    }
  };

  const handlePayPackage = async (pkg: PackageWithPayment) => {
    setIsProcessingPayment(true);
    try {
      const response = await fetch("/api/packages/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        alert(err?.error || "Gagal memproses pembayaran");
        return;
      }

      const result = await response.json();
      if (result.success && result.qrPayload) {
        setQrModal({
          qrPayload: result.qrPayload,
          receiptNumber: pkg.receiptNumber,
          isFree: result.isMemberFree || false,
        });
        setPaymentModal(null);
        // Reload dashboard to reflect payment after modal closes
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setIsProcessingPayment(false);
    }
  };
  const formatDate = (value: string | Date) => {
    return new Date(value).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "pagi";
    if (hour < 15) return "siang";
    if (hour < 18) return "sore";
    return "malam";
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Memeriksa autentikasi...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Error: Data user tidak ditemukan. Silakan login ulang atau hubungi admin.</p>
      </div>
    );
  }

  const isMemberActive =
    data.user.isMember &&
    data.user.memberExpiryDate &&
    new Date(data.user.memberExpiryDate) > new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Hi, {data.user.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              Selamat {getGreeting()}
            </p>
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  title="Status langganan"
                  ref={crownRef}
                >
                  <Crown className="w-4 h-4 text-yellow-500" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Info Langganan
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={isMemberActive ? "default" : "secondary"}>
                      {isMemberActive ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {isMemberActive ? "Membership aktif" : "Belum berlangganan"}
                    </span>
                  </div>
                  {isMemberActive && data.user.memberExpiryDate && (
                    <p className="text-sm">
                      Berlaku hingga {formatDate(data.user.memberExpiryDate)}
                    </p>
                  )}
                  <Button asChild className="w-full">
                    <Link href="/membership">
                      {isMemberActive ? "Perpanjang" : "Beli Langganan"}
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              size="icon"
              onClick={requestNotificationPermission}
              disabled={notifLoading}
              title="Aktifkan notifikasi"
              ref={bellRef}
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" asChild title="Profil">
              <Link href="/profile">
                <User className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Packages Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" ref={pendingRef}>
              Menunggu ({data.pendingPackages.length})
            </TabsTrigger>
            <TabsTrigger value="completed" ref={completedRef}>
              Selesai ({data.completedPackages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {data.pendingPackages.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Tidak ada paket menunggu
                  </p>
                </CardContent>
              </Card>
            ) : (
              data.pendingPackages.map((pkg: PackageWithPayment) => (
                <Card key={pkg.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{pkg.receiptNumber}</h3>
                        <p className="text-sm text-muted-foreground">{pkg.courierName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Lokasi</p>
                          <p className="font-medium">{pkg.location.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Diterima</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(pkg.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 border-t pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Harga Layanan:</span>
                          <span className="font-semibold">
                            Rp {Number(pkg.basePrice).toLocaleString("id-ID")}
                          </span>
                        </div>
                        {Number(pkg.penaltyFee) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Denda Keterlambatan:</span>
                            <span className="text-destructive font-semibold">
                              Rp {Number(pkg.penaltyFee).toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                          <span>Total:</span>
                          <span>
                            Rp {(Number(pkg.basePrice) + Number(pkg.penaltyFee)).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <Badge
                          variant={
                            pkg.paymentStatus === "PAID"
                              ? "default"
                              : isMemberActive
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {pkg.paymentStatus === "PAID"
                            ? "✓ Sudah Dibayar"
                            : isMemberActive
                            ? "👑 Member"
                            : "Belum Dibayar"}
                        </Badge>
                        {pkg.paymentStatus === "PAID" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await fetch("/api/packages/pay", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ packageId: pkg.id }),
                              });
                              const data = await res.json();
                              if (data.qrPayload) {
                                setQrModal({
                                  qrPayload: data.qrPayload,
                                  receiptNumber: pkg.receiptNumber,
                                  isFree: data.isMemberFree || false,
                                });
                              }
                            }}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            Tampilkan QR
                          </Button>
                        ) : isMemberActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              setIsProcessingPayment(true);
                              try {
                                const res = await fetch("/api/packages/pay", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ packageId: pkg.id }),
                                });
                                const data = await res.json();
                                if (data.qrPayload) {
                                  setQrModal({
                                    qrPayload: data.qrPayload,
                                    receiptNumber: pkg.receiptNumber,
                                    isFree: data.isMemberFree || false,
                                  });
                                  // Reload dashboard to update package status
                                  const dashboardRes = await fetch("/api/dashboard");
                                  const dashboardData = await dashboardRes.json();
                                  setData(dashboardData);
                                }
                              } finally {
                                setIsProcessingPayment(false);
                              }
                            }}
                            disabled={isProcessingPayment}
                          >
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              <>
                                <QrCode className="mr-2 h-4 w-4" />
                                Dapatkan QR Code
                              </>
                            )}
                          </Button>
                        ) : (
                          <Sheet open={paymentModal?.packageId === pkg.id} onOpenChange={(open) => {
                            if (!open) setPaymentModal(null);
                          }}>
                            <SheetTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setPaymentModal({ packageId: pkg.id, package: pkg })}
                              >
                                Bayar Sekarang
                              </Button>
                            </SheetTrigger>
                            {paymentModal?.packageId === pkg.id && (
                              <SheetContent side="right" className="w-96 sm:w-full">
                                <SheetHeader className="mb-6">
                                  <SheetTitle>
                                    {isMemberActive ? "✓ Member Gratis" : "Konfirmasi Pembayaran"}
                                  </SheetTitle>
                                </SheetHeader>
                                <div className="space-y-6">
                                  {isMemberActive && (
                                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                      <p className="text-sm text-green-800 dark:text-green-200">
                                        <strong>🎉 Gratis!</strong> Sebagai member aktif, Anda tidak perlu membayar biaya layanan.
                                      </p>
                                    </div>
                                  )}

                                  <div className="space-y-3 bg-muted p-4 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Resi:</span>
                                      <span className="font-mono font-semibold">{pkg.receiptNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Kurir:</span>
                                      <span>{pkg.courierName}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Lokasi:</span>
                                      <span>{pkg.location.name}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-semibold">
                                      <span>Total Pembayaran:</span>
                                      <span>
                                        {isMemberActive ? (
                                          <span className="text-green-600">Rp 0 (Gratis)</span>
                                        ) : (
                                          `Rp ${(Number(pkg.basePrice) + Number(pkg.penaltyFee)).toLocaleString("id-ID")}`
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                      <strong>Catatan:</strong> Setelah pembayaran, Anda akan mendapatkan QR code untuk mengambil paket.
                                    </p>
                                  </div>

                                  <Button
                                    className="w-full"
                                    onClick={() => handlePayPackage(pkg)}
                                    disabled={isProcessingPayment}
                                  >
                                    {isProcessingPayment ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                      </>
                                    ) : isMemberActive ? (
                                      "Dapatkan QR Code"
                                    ) : (
                                      "Lanjutkan Pembayaran"
                                    )}
                                  </Button>
                                </div>
                              </SheetContent>
                            )}
                          </Sheet>
                        )}
                      </div>
                    </div>
                  </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {data.completedPackages.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Tidak ada riwayat paket
                  </p>
                </CardContent>
              </Card>
            ) : (
              data.completedPackages.map((pkg: any) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {pkg.receiptNumber}
                    </CardTitle>
                    <CardDescription>
                      Selesai: {formatDate(pkg.updatedAt)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {isTourOpen && bubbleStyle && (
          <div
            className="fixed z-50 max-w-sm rounded-xl border bg-background/95 shadow-lg backdrop-blur-sm"
            style={{ top: bubbleStyle.top, left: bubbleStyle.left, transform: "translateX(-50%)" }}
          >
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold">{tourSteps[tourStep].title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {tourSteps[tourStep].description}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={finishTour}>
                  Lewati
                </Button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {tourStep + 1}/{tourSteps.length}
                  </span>
                  <Button size="sm" onClick={nextTour}>
                    {tourStep === tourSteps.length - 1 ? "Selesai" : "Lanjut"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Modal */}
        {qrModal && (
          <Sheet open={!!qrModal} onOpenChange={(open) => {
            if (!open) {
              setQrModal(null);
              window.location.reload();
            }
          }}>
            <SheetContent side="right" className="w-full max-w-md">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  {qrModal.isFree ? "Gratis untuk Member!" : "Pembayaran Berhasil"}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-6">
                {qrModal.isFree && (
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>🎉 Member Aktif:</strong> Paket ini gratis karena Anda adalah member aktif!
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Resi Paket:</p>
                    <p className="text-lg font-mono font-semibold">{qrModal.receiptNumber}</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border-2 border-blue-200">
                    <QRCodeDisplay data={qrModal.qrPayload} size={250} />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      <strong>Cara Ambil Paket:</strong>
                    </p>
                    <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                      <li>Tunjukkan QR code ini ke petugas</li>
                      <li>Petugas akan scan QR code</li>
                      <li>Paket Anda siap diambil</li>
                    </ol>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setQrModal(null);
                    window.location.reload();
                  }}
                >
                  Selesai
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}
