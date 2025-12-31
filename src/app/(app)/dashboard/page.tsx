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
import { Bell, User, Crown } from "lucide-react";

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



  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
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

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Error memuat data</p>
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
              <Link href="/profile" ref={profileRef}>
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
              data.pendingPackages.map((pkg: any) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {pkg.receiptNumber}
                    </CardTitle>
                    <CardDescription>Kurir: {pkg.courierName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lokasi:</span>
                      <span>{pkg.location.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Harga:</span>
                      <span className="font-semibold">
                        Rp {pkg.basePrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                    {pkg.penaltyFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Denda:</span>
                        <span className="text-destructive">
                          Rp {pkg.penaltyFee.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Status Bayar:</span>
                      <Badge
                        variant={
                          pkg.paymentStatus === "PAID" ? "default" : "destructive"
                        }
                      >
                        {pkg.paymentStatus === "PAID" ? "Lunas" : "Belum"}
                      </Badge>
                    </div>
                  </CardContent>
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
      </div>
    </div>
  );
}
