"use client";

import { useState, useEffect } from "react";
import { loginUser, registerUser, checkUserExists } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

type LoginStep = "phone" | "pin" | "register";

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [apartmentName, setApartmentName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem("savedPhone");
      if (savedPhone) {
        setPhone(savedPhone);
        setRememberMe(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const phoneParam = searchParams.get("phone");
      if (phoneParam) {
        const formatted = phoneParam.replace(/\s+/g, "");
        setPhone(formatPhone(formatted));
        setRememberMe(true);
      }
    }
  }, [searchParams]);

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

    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem("savedPhone", formattedPhone);
      } else {
        localStorage.removeItem("savedPhone");
      }
    }

    setIsLoading(true);
    try {
      const result = await checkUserExists(formattedPhone);

      if (result.isNewUser) {
        // New user → go to registration
        setIsNewUser(true);
        setStep("register");
        toast({
          title: "Pengguna Baru",
          description: "Silakan lengkapi data untuk registrasi",
        });
      } else {
        // Existing user → go to PIN
        setIsNewUser(false);
        setStep("pin");
        toast({
          title: `Selamat datang kembali, ${result.userName}!`,
          description: "Masukkan PIN Anda",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan, coba lagi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !pin) {
      toast({
        title: "Error",
        description: "Nama dan PIN harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      toast({
        title: "Error",
        description: "PIN harus 6 digit angka",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser({
        phone,
        name,
        pin,
        unit,
        apartmentName
      });

      if (result.success) {
        toast({
          title: "Sukses",
          description: result.message + ". Silakan login dengan PIN yang baru dibuat.",
        });
        // Auto login sudah dilakukan di server action, langsung ke dashboard customer
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

    if (!/^\d{6}$/.test(pin)) {
      toast({
        title: "Error",
        description: "PIN harus 6 digit angka",
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
        // Login via /login selalu diarahkan ke dashboard customer
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
          <CardDescription>
            {step === "phone" && "Masuk atau daftar akun baru"}
            {step === "pin" && "Masukkan PIN Anda"}
            {step === "register" && "Lengkapi data registrasi"}
          </CardDescription>
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Memeriksa..." : "Lanjutkan"}
              </Button>
            </form>
          )}

          {step === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nomor: {phone}
              </p>
              <div>
                <label className="text-sm font-medium">Nama Lengkap *</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Buat PIN (6 digit) *</label>
                <Input
                  type="password"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PIN akan digunakan untuk login
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Unit (opsional)</label>
                <Input
                  type="text"
                  placeholder="A-101"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nama Apartemen (opsional)</label>
                <Input
                  type="text"
                  placeholder="Apartemen Sudirman"
                  value={apartmentName}
                  onChange={(e) => setApartmentName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Proses..." : "Daftar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("phone");
                    setPin("");
                    setName("");
                    setUnit("");
                    setApartmentName("");
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
                Nomor: {phone}
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
                  autoFocus
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
                    setStep("phone");
                    setPin("");
                  }}
                >
                  Ubah Nomor
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
