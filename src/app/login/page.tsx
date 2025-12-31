"use client";

import { useState, useEffect } from "react";
import { loginUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type LoginStep = "phone" | "otp" | "pin";

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const savedPhone = localStorage.getItem("savedPhone");
    if (savedPhone) {
      setPhone(savedPhone);
      setRememberMe(true);
    }
  }, []);

  const formatPhone = (value: string) => {
    let cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return cleaned;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast({
        title: "Error",
        description: "Nomor telepon tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }
    const formattedPhone = formatPhone(phone);
    setPhone(formattedPhone);
    
    if (rememberMe) {
      localStorage.setItem("savedPhone", formattedPhone);
    } else {
      localStorage.removeItem("savedPhone");
    }
    
    // Simulate OTP sent
    toast({
      title: "Sukses",
      description: `OTP dikirim ke ${formattedPhone} (simulasi)`,
    });
    setStep("otp");
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast({
        title: "Error",
        description: "OTP tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }
    // Simulate OTP verification
    toast({
      title: "Sukses",
      description: "OTP terverifikasi",
    });
    setStep("pin");
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      toast({
        title: "Error",
        description: "PIN tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(phone, pin);
      if (result.success) {
        toast({
          title: "Sukses",
          description: result.message,
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">PickPoint</CardTitle>
          <CardDescription>Masuk ke akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nomor Telepon</label>
                <Input
                  type="tel"
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Awalan 0 akan otomatis diubah ke 62
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="remember" className="text-sm font-medium">
                  Ingat saya
                </label>
              </div>
              <Button type="submit" className="w-full">
                Lanjutkan
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Kode OTP dikirim ke {phone}
              </p>
              <div>
                <label className="text-sm font-medium">Kode OTP</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <Button type="submit" className="w-full">
                  Verifikasi
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                >
                  Ubah Nomor
                </Button>
              </div>
            </form>
          )}

          {step === "pin" && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Masukkan PIN (default: 123456)
              </p>
              <div>
                <label className="text-sm font-medium">PIN (6 digit)</label>
                <Input
                  type="password"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Proses..." : "Masuk"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("otp");
                    setPin("");
                  }}
                >
                  Kembali
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
