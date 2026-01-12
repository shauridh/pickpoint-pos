"use client";

import { useState, useRef, use, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Package, MapPin, Scan, X } from "lucide-react";
import { KioskWebcam } from "@/components/KioskWebcam";
import type { ResiScannerProps } from "@/components/ResiScanner";

type FormStep = "form" | "success" | "thankyou";

interface FormData {
  courier: string;
  userId: string;
  userName: string;
  receiptNumber: string;
  size: string;
  photoUrl: string;
  location: string;
}

const couriers = [
  { id: "jne", name: "JNE" },
  { id: "jnt", name: "J&T" },
  { id: "sicepat", name: "SiCepat" },
  { id: "anteraja", name: "AnterAja" },
  { id: "ninja", name: "Ninja Xpress" },
  { id: "spx", name: "SPX" },
];

const ResiScanner = dynamic<ResiScannerProps>(
  () => import("@/components/ResiScanner").then((mod) => mod.ResiScanner),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 text-white text-sm">
        Menyiapkan kamera...
      </div>
    ),
  }
);

// Display helper: slug to readable location name
const formatLocationName = (slug: string) => {
  const decoded = decodeURIComponent(slug);
  return decoded
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Masking nomor WA - sisakan 6 digit terakhir
const maskPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length <= 6) return phone;
  return "*".repeat(cleaned.length - 6) + cleaned.slice(-6);
};

const maskRecipient = (name: string, phone: string, unit: string, apartment: string) => {
  const phoneMasked = maskPhoneNumber(phone);
  return `${name} (${phoneMasked}) - ${apartment} ${unit}`;
};

export default function DropOffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locationSlug = slug;
  const locationName = formatLocationName(locationSlug);

  const [step, setStep] = useState<FormStep>("form");
  const [pricingScheme, setPricingScheme] = useState<string | null>(null);
  const [scannerMode, setScannerMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    courier: "",
    userId: "",
    userName: "",
    receiptNumber: "",
    size: "",
    photoUrl: "",
    location: locationName,
  });
  
  const [courierSearch, setCourierSearch] = useState("");
  const [courierDropdown, setCourierDropdown] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientResults, setRecipientResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recipientInputRef = useRef<HTMLInputElement>(null);
  const courierInputRef = useRef<HTMLInputElement>(null);
  const resiInputRef = useRef<HTMLInputElement>(null);
  const scannerFocusReadyRef = useRef(false);

  // Fetch location's pricing scheme on mount
  useEffect(() => {
    const fetchLocationScheme = async () => {
      try {
        const res = await fetch(`/api/locations/scheme?slug=${encodeURIComponent(locationSlug)}`);
        if (res.ok) {
          const data = await res.json();
          setPricingScheme(data.pricingScheme || null);
        }
      } catch (error) {
        console.error("Failed to fetch location scheme:", error);
      }
    };
    fetchLocationScheme();
  }, [locationSlug]);

  // Refocus manual input after keluar dari mode scanner
  useEffect(() => {
    if (!scannerFocusReadyRef.current) {
      scannerFocusReadyRef.current = true;
      return;
    }

    if (!scannerMode && resiInputRef.current) {
      resiInputRef.current.focus();
    }
  }, [scannerMode]);

  // Search recipients filtered by location
  const handleRecipientSearch = async (query: string) => {
    setRecipientSearch(query);
    if (query.length < 2) {
      setRecipientResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(locationSlug)}`);
      const data = await res.json();
      setRecipientResults(data.users || []);
    } catch (error) {
      console.error("Search error:", error);
      setRecipientResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRecipient = (user: any) => {
    const masked = maskRecipient(user.name, user.phone, user.unit, user.apartmentName);
    setFormData({
      ...formData,
      userId: user.id,
      userName: masked,
      location: user.apartmentName,
    });
    setRecipientSearch("");
    setRecipientResults([]);
  };

  // Courier selection
  const filteredCouriers = couriers.filter((c) =>
    c.name.toLowerCase().includes(courierSearch.toLowerCase())
  );

  const handleSelectCourier = (courier: string) => {
    setFormData({ ...formData, courier });
    setCourierSearch("");
    setCourierDropdown(false);
  };

  // Form validation (size optional)
  const canSubmit = formData.courier && formData.userId && formData.receiptNumber && formData.photoUrl;

  // Submit
  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/drop/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, locationSlug }),
      });

      if (response.ok) {
        setStep("success");
      } else {
        const err = await response.json().catch(() => null);
        alert(err?.error || "Gagal menyimpan paket");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset without changing courier & location
  const handleInputAgain = () => {
    setFormData({
      ...formData,
      userId: "",
      userName: "",
      receiptNumber: "",
      size: "",
      photoUrl: "",
    });
    setPhotoMode(false);
    setStep("form");
    recipientInputRef.current?.focus();
  };

  // Back to home
  const handleFinish = () => {
    setStep("thankyou");
  };

  // Thank you screen
  if (step === "thankyou") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 p-6 rounded-full">
                <Package className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-800">Terima Kasih!</h2>
              <p className="text-lg text-gray-600">
                Paket sudah berhasil didaftarkan
              </p>
              <div className="pt-4 pb-2">
                <p className="text-sm text-gray-500">
                  Penerima akan mendapat notifikasi bahwa paket sudah tiba di lokasi
                </p>
              </div>
            </div>
            <div className="pt-6 border-t">
              <p className="text-xs text-gray-400">
                Tutup tab ini untuk selesai atau scan ulang untuk input paket lagi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 flex items-center justify-center">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Sukses!</h2>
              <p className="text-gray-600 mt-2">Paket berhasil didaftarkan</p>
              <p className="text-sm text-gray-500 mt-1">Resi: {formData.receiptNumber}</p>
              <p className="text-xs text-gray-500">Lokasi: {locationName}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleInputAgain} className="w-full">
                Input Paket Lagi
              </Button>
              <Button onClick={handleFinish} variant="outline" className="w-full">
                Selesai
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      {scannerMode && (
        <ResiScanner
          onDetected={(value) =>
            setFormData((prev) => ({
              ...prev,
              receiptNumber: value,
            }))
          }
          onClose={() => setScannerMode(false)}
          helperText="Pastikan label barcode berada di tengah garis bantu"
        />
      )}
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold">Drop-Off Paket</h1>
        </div>

        {/* Locked location banner */}
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <MapPin className="w-4 h-4" />
          <div className="flex-1">
            <p className="font-semibold">Lokasi terkunci</p>
            <p className="text-xs text-blue-600">{locationName}</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6 space-y-4">
            {!photoMode ? (
              <>
                {/* Penerima */}
                <div>
                  <label className="text-sm font-semibold mb-1 block">Penerima</label>
                  <Input
                    ref={recipientInputRef}
                    placeholder="Cari nama, unit, atau WA..."
                    value={recipientSearch}
                    onChange={(e) => handleRecipientSearch(e.target.value)}
                    className="h-10 text-sm"
                  />
                  {isSearching && <p className="text-xs text-gray-500 mt-1">Mencari...</p>}

                  {recipientResults.length > 0 && (
                    <div className="border rounded mt-1 max-h-40 overflow-y-auto">
                      {recipientResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectRecipient(user)}
                          className="w-full p-2 text-left hover:bg-gray-100 border-b last:border-b-0 text-xs"
                        >
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-gray-600">
                            {maskPhoneNumber(user.phone)} • {user.apartmentName} - {user.unit}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {formData.userId && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <p className="font-semibold text-blue-700">✓ {formData.userName}</p>
                    </div>
                  )}
                </div>

                {/* Resi with Scanner Mode */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold">No. Resi</label>
                    <button
                      onClick={() => setScannerMode((prev) => !prev)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      type="button"
                    >
                      <Scan className="w-3 h-3" />
                      {scannerMode ? "Mode Manual" : "Mode Scanner"}
                    </button>
                  </div>
                  {scannerMode ? (
                    <div className="space-y-3 rounded-xl border-2 border-blue-400 bg-blue-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                        <Scan className="h-4 w-4 animate-pulse" />
                        <span>Scanner kamera aktif</span>
                      </div>
                      <p className="text-xs text-blue-600">
                        Kamera sedang terbuka penuh. Arahkan barcode ke kotak panduan dan tunggu hingga terbaca otomatis.
                      </p>
                      {formData.receiptNumber && (
                        <div className="rounded-lg border border-blue-200 bg-white p-2 text-center font-mono text-sm text-blue-700">
                          Terbaca: {formData.receiptNumber}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScannerMode(false)}
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Matikan Scanner
                      </Button>
                    </div>
                  ) : (
                    <Input
                      ref={resiInputRef}
                      placeholder="Ketik nomor resi..."
                      value={formData.receiptNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, receiptNumber: e.target.value })
                      }
                      className="h-10 text-sm"
                    />
                  )}
                </div>

                {/* Expedisi (Searchable) */}
                <div className="relative">
                  <label className="text-sm font-semibold mb-1 block">Expedisi</label>
                  <div className="relative">
                    <Input
                      ref={courierInputRef}
                      placeholder="Pilih atau ketik..."
                      value={courierSearch || formData.courier}
                      onChange={(e) => {
                        setCourierSearch(e.target.value);
                        setCourierDropdown(true);
                      }}
                      onFocus={() => setCourierDropdown(true)}
                      className="h-10 text-sm"
                    />
                    {formData.courier && !courierSearch && (
                      <X
                        className="w-4 h-4 absolute right-3 top-3 cursor-pointer text-gray-400"
                        onClick={() => setFormData({ ...formData, courier: "" })}
                      />
                    )}
                  </div>

                  {courierDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 border bg-white rounded shadow-lg z-10 max-h-40 overflow-y-auto">
                      {filteredCouriers.length > 0 ? (
                        filteredCouriers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectCourier(c.name)}
                            className="w-full p-2 text-left hover:bg-gray-100 border-b last:border-b-0 text-sm"
                          >
                            {c.name}
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={() =>
                            handleSelectCourier(courierSearch)
                          }
                          className="w-full p-2 text-left text-sm text-gray-600"
                        >
                          Gunakan: "{courierSearch}"
                        </button>
                      )}
                    </div>
                  )}

                  {formData.courier && (
                    <div className="mt-1 text-xs text-green-600 font-semibold">
                      ✓ {formData.courier}
                    </div>
                  )}
                </div>

                {/* Size - Only for FLAT_SIZE scheme */}
                {pricingScheme === "FLAT_SIZE" && (
                  <div>
                    <label className="text-sm font-semibold mb-1 block">
                      Ukuran Paket
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {["S", "M", "L", "XL"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setFormData({ ...formData, size })}
                          className={`p-2 rounded text-xs font-semibold border transition ${
                            formData.size === size
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Foto Paket</label>
                  {!formData.photoUrl ? (
                    <Button
                      onClick={() => setPhotoMode(true)}
                      variant="outline"
                      className="w-full h-10 text-sm"
                    >
                      Ambil Foto
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                      <span className="text-xs text-green-700 font-semibold">✓ Foto sudah diambil</span>
                      <Button
                        onClick={() => setFormData({ ...formData, photoUrl: "" })}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="w-full h-10"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Paket"}
                </Button>
              </>
            ) : (
              // Camera mode
              <div>
                <div className="mb-3">
                  <Button
                    onClick={() => setPhotoMode(false)}
                    variant="ghost"
                    className="text-sm"
                  >
                    ← Kembali
                  </Button>
                </div>
                <KioskWebcam
                  instruction="Pastikan label resi dan kondisi paket terlihat jelas"
                  onUpload={(url) => {
                    setFormData({ ...formData, photoUrl: url });
                    setPhotoMode(false);
                  }}
                  onCancel={() => setPhotoMode(false)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
