"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, ArrowLeft } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";

type Step = "courier" | "recipient" | "details" | "camera" | "confirm";
type PackageSize = "SMALL" | "MEDIUM" | "LARGE";

interface FormData {
  courier: string;
  userId: string;
  userName: string;
  receiptNumber: string;
  size: PackageSize | "";
  photoUrl: string;
}

const couriers = [
  { id: "jne", name: "JNE", color: "bg-red-500" },
  { id: "jnt", name: "J&T", color: "bg-red-600" },
  { id: "sicepat", name: "SiCepat", color: "bg-yellow-500" },
  { id: "anteraja", name: "AnterAja", color: "bg-blue-600" },
  { id: "ninja", name: "Ninja Xpress", color: "bg-purple-600" },
  { id: "shopee", name: "SPX", color: "bg-orange-500" },
];

const sizes = [
  { id: "SMALL", name: "Kecil", description: "< 2kg", color: "bg-green-100" },
  { id: "MEDIUM", name: "Sedang", description: "2-5kg", color: "bg-blue-100" },
  { id: "LARGE", name: "Besar", description: "> 5kg", color: "bg-purple-100" },
];

export default function DropOffPage() {
  const [step, setStep] = useState<Step>("courier");
  const [formData, setFormData] = useState<FormData>({
    courier: "",
    userId: "",
    userName: "",
    receiptNumber: "",
    size: "",
    photoUrl: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCourierSelect = (courier: string) => {
    setFormData({ ...formData, courier });
    setStep("recipient");
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: any) => {
    setFormData({
      ...formData,
      userId: user.id,
      userName: `${user.name} - ${user.apartmentName} ${user.unit}`,
    });
    setSearchQuery(`${user.name} - ${user.apartmentName} ${user.unit}`);
    setSearchResults([]);
  };

  const handleNext = () => {
    if (step === "recipient" && formData.userId) {
      setStep("details");
    } else if (step === "details" && formData.receiptNumber && formData.size) {
      setStep("camera");
    } else if (step === "camera" && formData.photoUrl) {
      setStep("confirm");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/packages/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Paket berhasil didaftarkan!");
        // Reset form
        setFormData({
          courier: "",
          userId: "",
          userName: "",
          receiptNumber: "",
          size: "",
          photoUrl: "",
        });
        setSearchQuery("");
        setStep("courier");
      } else {
        alert("Gagal menyimpan paket");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-800">Portal Drop-Off</h1>
        </div>
        <p className="text-gray-600 text-lg">Sistem pendaftaran paket untuk kurir</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center gap-2 mb-8">
        <Badge variant={step === "courier" ? "default" : "outline"}>1. Ekspedisi</Badge>
        <Badge variant={step === "recipient" ? "default" : "outline"}>2. Penerima</Badge>
        <Badge variant={step === "details" ? "default" : "outline"}>3. Detail</Badge>
        <Badge variant={step === "camera" ? "default" : "outline"}>4. Foto</Badge>
        <Badge variant={step === "confirm" ? "default" : "outline"}>5. Konfirmasi</Badge>
      </div>

      {/* Step: Pilih Ekspedisi */}
      {step === "courier" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Pilih Ekspedisi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {couriers.map((courier) => (
                <Button
                  key={courier.id}
                  onClick={() => handleCourierSelect(courier.name)}
                  className={`h-24 text-xl ${courier.color} hover:opacity-90`}
                >
                  {courier.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Pilih Penerima */}
      {step === "recipient" && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep("courier")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-2xl">Cari Penerima</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Cari nama, unit, atau telepon..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="text-lg h-14"
              />
              {isSearching && <p className="text-sm text-gray-500 mt-2">Mencari...</p>}
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full p-4 text-left hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600">
                      {user.apartmentName} - Unit {user.unit}
                    </p>
                    <p className="text-sm text-gray-500">{user.phone}</p>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-600 font-semibold">User tidak ditemukan</p>
                <p className="text-sm text-red-500">Hubungi petugas untuk registrasi</p>
              </div>
            )}

            {formData.userId && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Penerima dipilih: {formData.userName}
                </p>
              </div>
            )}

            <Button
              onClick={handleNext}
              disabled={!formData.userId}
              className="w-full h-14 text-lg"
            >
              Lanjutkan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Detail Paket */}
      {step === "details" && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep("recipient")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-2xl">Detail Paket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-lg font-semibold mb-2 block">Nomor Resi</label>
              <Input
                placeholder="Masukkan nomor resi..."
                value={formData.receiptNumber}
                onChange={(e) =>
                  setFormData({ ...formData, receiptNumber: e.target.value })
                }
                className="text-lg h-14"
              />
            </div>

            <div>
              <label className="text-lg font-semibold mb-3 block">Ukuran Paket</label>
              <div className="grid grid-cols-3 gap-4">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() =>
                      setFormData({ ...formData, size: size.id as PackageSize })
                    }
                    className={`p-6 rounded-lg border-2 transition ${
                      formData.size === size.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    <p className="font-bold text-lg">{size.name}</p>
                    <p className="text-sm text-gray-600">{size.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={!formData.receiptNumber || !formData.size}
              className="w-full h-14 text-lg"
            >
              Lanjutkan ke Foto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Kamera */}
      {step === "camera" && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep("details")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-2xl">Ambil Foto Paket</CardTitle>
          </CardHeader>
          <CardContent>
            <CameraCapture
              onCapture={(url) => {
                setFormData({ ...formData, photoUrl: url });
                setStep("confirm");
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Step: Konfirmasi */}
      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Konfirmasi Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="font-semibold">Ekspedisi:</span>
                <span>{formData.courier}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Penerima:</span>
                <span>{formData.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">No. Resi:</span>
                <span>{formData.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Ukuran:</span>
                <span>{formData.size}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep("camera")}
                className="flex-1 h-14 text-lg"
              >
                Kembali
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 h-14 text-lg"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Paket"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
