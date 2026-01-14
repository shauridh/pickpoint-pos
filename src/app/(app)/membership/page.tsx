"use client";

import { useEffect, useState } from "react";
import { getSessionFromClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createMembershipTransaction,
  simulatePaymentSuccess,
} from "@/actions/membership";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface MembershipPlan {
  id: number;
  name: string;
  price: string;
  durationInDays: number;
  description?: string;
}

interface PaymentDialogData {
  planId: number;
  transactionId?: string;
}

export default function MembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogData | null>(
    null
  );
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSessionFromClient();
        if (!session.userId) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Membership session check error:", error);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await fetch("/api/membership-plans");
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error("Load plans error:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data paket",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, [toast]);

  const handleBuyPlan = async (planId: number) => {
    setIsProcessing(true);
    try {
      const result = await createMembershipTransaction(planId);
      if (result.success) {
        setPaymentDialog({
          planId,
          transactionId: result.transactionId,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePayment = async (transactionId: string) => {
    setIsProcessing(true);
    try {
      const result = await simulatePaymentSuccess(transactionId);
      if (result.success) {
        toast({
          title: "Sukses",
          description: result.message,
        });
        setPaymentDialog(null);
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Beli Langganan</h1>
        </div>

        <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            Dapatkan akses unlimited dengan menjadi member. Harga layanan jasa
            akan gratis selama membership aktif.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="flex flex-col hover:border-primary/50 transition-colors"
            >
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.durationInDays} hari masa aktif
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Harga</p>
                  <p className="text-3xl font-bold">
                    Rp{" "}
                    {typeof plan.price === "string"
                      ? parseInt(plan.price).toLocaleString("id-ID")
                      : Number(plan.price).toLocaleString("id-ID")}
                  </p>
                </div>

                {plan.description && (
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                )}

                <Dialog
                  open={paymentDialog?.planId === plan.id}
                  onOpenChange={(open) => {
                    if (!open) setPaymentDialog(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      onClick={() => handleBuyPlan(plan.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Proses..." : "Beli Sekarang"}
                    </Button>
                  </DialogTrigger>

                  {paymentDialog?.planId === plan.id && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
                        <DialogDescription>
                          Simulasi pembayaran untuk {plan.name}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Paket:</span>
                            <span className="font-semibold">{plan.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Harga:</span>
                            <span className="font-semibold">
                              Rp{" "}
                              {typeof plan.price === "string"
                                ? parseInt(plan.price).toLocaleString(
                                  "id-ID"
                                )
                                : Number(plan.price).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-2">
                            <span>Durasi:</span>
                            <span className="font-semibold">
                              {plan.durationInDays} hari
                            </span>
                          </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Mode Simulasi:</strong> Klik tombol di bawah
                            untuk mensimulasikan pembayaran berhasil.
                          </p>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() =>
                            handleSimulatePayment(
                              paymentDialog.transactionId || ""
                            )
                          }
                          disabled={isProcessing}
                        >
                          {isProcessing
                            ? "Proses..."
                            : "Simulasi Bayar Sukses"}
                        </Button>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
