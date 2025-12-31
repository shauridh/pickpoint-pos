"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionFromClient } from "@/lib/auth-client";
import { updateUserProfile } from "@/actions/profile";
import { logoutUser } from "@/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  phone: z.string().min(10, "Nomor telepon minimal 10 karakter"),
  unit: z.string().min(1, "Unit tidak boleh kosong"),
  apartmentName: z.string().min(1, "Apartemen tidak boleh kosong"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      unit: "",
      apartmentName: "",
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Check auth
        const session = await getSessionFromClient();
        if (!session.userId) {
          router.push("/login");
          return;
        }

        // Fetch profile via API
        const response = await fetch("/api/profile");
        const data = await response.json();

        if (data.user) {
          form.reset({
            name: data.user.name,
            phone: data.user.phone,
            unit: data.user.unit || "",
            apartmentName: data.user.apartmentName || "",
          });
        }
      } catch (error) {
        console.error("Load profile error:", error);
        toast({
          title: "Error",
          description: "Gagal memuat profil",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router, form, toast]);

  const onSubmit = async (formData: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateUserProfile(formData);
      if (result.success) {
        toast({
          title: "Sukses",
          description: result.message,
        });
        // Update session in local storage / refresh if needed
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Profil</h1>
          <div className="w-10" />
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Data Diri</CardTitle>
            <CardDescription>
              Perbarui informasi data penerima paket Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama lengkap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+6281234567890"
                          type="tel"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Apartment Name */}
                <FormField
                  control={form.control}
                  name="apartmentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apartemen</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Green Pramuka" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Number */}
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: A-101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Logout Card */}
        <Card className="mt-4 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-base">Keluar Akun</CardTitle>
            <CardDescription>
              Anda akan dikembalikan ke halaman login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
