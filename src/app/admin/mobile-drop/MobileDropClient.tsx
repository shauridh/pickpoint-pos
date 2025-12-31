"use client";

import { useMemo, useState, useTransition } from "react";
import { createPackageByStaff, quickCreateUser } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/CameraCapture";
import {
  CheckCircle2,
  Loader2,
  Plus,
  ScanLine,
  Search,
  Wand2,
  PackagePlus,
  ImageOff,
} from "lucide-react";

const couriers = [
  { id: "jne", name: "JNE" },
  { id: "jnt", name: "J&T" },
  { id: "sicepat", name: "SiCepat" },
  { id: "anteraja", name: "AnterAja" },
  { id: "ninja", name: "Ninja Xpress" },
  { id: "spx", name: "SPX" },
];

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const maskPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length <= 4) return phone;
  return `${"*".repeat(Math.max(0, cleaned.length - 4))}${cleaned.slice(-4)}`;
};

const formatUserLabel = (name: string, phone: string, unit?: string | null, apartment?: string | null) => {
  const unitPart = unit ? ` • ${unit}` : "";
  const apt = apartment ? ` (${apartment})` : "";
  return `${name}${unitPart}${apt} - ${maskPhone(phone)}`;
};

type LocationOption = { id: number; name: string; price: string };

type QuickAddState = {
  name: string;
  phone: string;
  unit: string;
};

export default function MobileDropClient({ locations }: { locations: LocationOption[] }) {
  const defaultLocationId = locations[0]?.id ?? 0;
  const [form, setForm] = useState({
    locationId: defaultLocationId,
    courier: "",
    receiptNumber: "",
    size: "",
    photoUrl: "",
    userId: "",
    userLabel: "",
    useCustomPrice: false,
    customPrice: "",
    bypassPhoto: false,
  });
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientResults, setRecipientResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<string | null>(null);
  const [createdLocation, setCreatedLocation] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddState, setQuickAddState] = useState<QuickAddState>({ name: "", phone: "", unit: "" });
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [isQuickSaving, startQuickSave] = useTransition();

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === form.locationId),
    [locations, form.locationId]
  );

  const handleSearchRecipient = async (value: string) => {
    setRecipientQuery(value);
    if (value.length < 2 || !selectedLocation) {
      setRecipientResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(value)}&location=${encodeURIComponent(toSlug(selectedLocation.name))}`);
      const data = await res.json();
      setRecipientResults(data.users || []);
    } catch (error) {
      console.error("Search error", error);
      setRecipientResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRecipient = (user: any) => {
    setForm((prev) => ({
      ...prev,
      userId: user.id,
      userLabel: formatUserLabel(user.name, user.phone, user.unit, user.apartmentName),
    }));
    setRecipientQuery("");
    setRecipientResults([]);
  };

  const handleSubmit = () => {
    setStatusMessage(null);
    setErrorMessage(null);

    if (!form.courier || !form.userId || !form.receiptNumber || !form.locationId) {
      setErrorMessage("Courier, penerima, resi, dan lokasi wajib diisi");
      return;
    }

    if (!form.photoUrl && !form.bypassPhoto) {
      setErrorMessage("Foto wajib kecuali bypass diaktifkan");
      return;
    }

    startSubmit(async () => {
      const result = await createPackageByStaff({
        courier: form.courier,
        userId: form.userId,
        receiptNumber: form.receiptNumber,
        size: form.size,
        photoUrl: form.photoUrl,
        locationId: form.locationId,
        useCustomPrice: form.useCustomPrice,
        customPrice: form.customPrice,
        bypassPhoto: form.bypassPhoto,
      });

      if (!result.success) {
        setErrorMessage(result.message || "Gagal menyimpan paket");
        return;
      }

      setCreatedReceipt(result.package?.receiptNumber || null);
      setCreatedLocation(selectedLocation?.name || null);
      setShowSuccess(true);
      setStatusMessage("Paket tersimpan untuk antrean");
      setForm({
        locationId: form.locationId,
        courier: form.courier,
        receiptNumber: "",
        size: "",
        photoUrl: "",
        userId: "",
        userLabel: "",
        useCustomPrice: form.useCustomPrice,
        customPrice: form.customPrice,
        bypassPhoto: form.bypassPhoto,
      });
    });
  };

  const handleQuickAdd = () => {
    setQuickAddError(null);
    if (!selectedLocation) {
      setQuickAddError("Pilih lokasi lebih dulu");
      return;
    }

    if (!quickAddState.name || !quickAddState.phone || !quickAddState.unit) {
      setQuickAddError("Nama, HP, dan unit wajib diisi");
      return;
    }

    startQuickSave(async () => {
      const result = await quickCreateUser({
        name: quickAddState.name,
        phone: quickAddState.phone,
        unit: quickAddState.unit,
        apartmentName: selectedLocation.name,
      });

      if (!result.success || !result.user) {
        setQuickAddError(result.message || "Gagal membuat user");
        return;
      }

      setForm((prev) => ({
        ...prev,
        userId: result.user.id,
        userLabel: formatUserLabel(result.user.name, result.user.phone, result.user.unit, result.user.apartmentName),
      }));
      setQuickAddState({ name: "", phone: "", unit: "" });
      setQuickAddOpen(false);
      setRecipientResults([]);
      setRecipientQuery("");
    });
  };

  const resetForm = () => {
    setShowSuccess(false);
    setStatusMessage(null);
    setErrorMessage(null);
    setForm((prev) => ({
      ...prev,
      receiptNumber: "",
      size: "",
      photoUrl: "",
      userId: "",
      userLabel: "",
    }));
  };

  const selectedPrice = selectedLocation ? Number(selectedLocation.price) : 0;

  return (
    <div className="space-y-4">
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Antrean Drop-Off</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border p-4 bg-slate-50">
              <div className="text-sm text-slate-500">Lokasi aktif</div>
              <div className="text-lg font-semibold">{selectedLocation?.name || "Pilih lokasi"}</div>
              <p className="text-xs text-slate-500">Harga rak: {selectedPrice ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedPrice) : "-"}</p>
            </div>
            <div className="rounded-lg border p-4 bg-slate-50">
              <div className="text-sm text-slate-500">Fitur petugas</div>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="secondary" className="text-xs"><Plus className="h-3 w-3 mr-1" /> Quick Add</Badge>
                <Badge variant="secondary" className="text-xs"><Wand2 className="h-3 w-3 mr-1" /> Harga Custom</Badge>
                <Badge variant="secondary" className="text-xs"><ImageOff className="h-3 w-3 mr-1" /> Bypass Foto</Badge>
              </div>
            </div>
          </div>

          {showSuccess && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <div className="font-semibold">Paket tersimpan</div>
                <div>Resi {createdReceipt || "-"} • Lokasi {createdLocation || "-"}</div>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={resetForm}>
                Input lagi
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm">Lokasi</Label>
              <select
                value={form.locationId}
                onChange={(e) => setForm((prev) => ({ ...prev, locationId: Number(e.target.value) }))}
                className="w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Kurir</Label>
                  <select
                    value={form.courier}
                    onChange={(e) => setForm((prev) => ({ ...prev, courier: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm"
                  >
                    <option value="">Pilih kurir</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Resi</Label>
                  <Input
                    placeholder="Nomor resi"
                    value={form.receiptNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, receiptNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Penerima</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Cari nama/unit"
                      value={recipientQuery}
                      onChange={(e) => handleSearchRecipient(e.target.value)}
                      className="pr-10"
                    />
                    <Search className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
                    {isSearching && <span className="absolute right-10 top-2 text-xs text-slate-400">cari...</span>}
                    {recipientResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow">
                        {recipientResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                            onClick={() => handleSelectRecipient(user)}
                          >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.apartmentName} • {user.unit}</div>
                            <div className="text-[11px] text-slate-400">{maskPhone(user.phone)}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="px-3">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Quick Add User</DialogTitle>
                        <DialogDescription>Tambah penghuni baru dan langsung pilih sebagai penerima.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-2">
                        <div className="space-y-1">
                          <Label>Nama</Label>
                          <Input
                            value={quickAddState.name}
                            onChange={(e) => setQuickAddState((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Nama lengkap"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>No HP</Label>
                          <Input
                            value={quickAddState.phone}
                            onChange={(e) => setQuickAddState((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="08xxxx"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Unit</Label>
                          <Input
                            value={quickAddState.unit}
                            onChange={(e) => setQuickAddState((prev) => ({ ...prev, unit: e.target.value }))}
                            placeholder="Unit/No Rumah"
                          />
                        </div>
                        {quickAddError && (
                          <p className="text-sm text-red-600">{quickAddError}</p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setQuickAddOpen(false)}>Batal</Button>
                        <Button onClick={handleQuickAdd} disabled={isQuickSaving}>
                          {isQuickSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan & pilih"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {form.userLabel && (
                  <p className="text-xs text-emerald-700">Dipilih: {form.userLabel}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Ukuran</Label>
                  <select
                    value={form.size}
                    onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm"
                  >
                    <option value="">Opsional</option>
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.useCustomPrice}
                      onChange={(e) => setForm((prev) => ({ ...prev, useCustomPrice: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    Harga custom
                  </Label>
                  <Input
                    placeholder="Rp"
                    type="number"
                    value={form.customPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, customPrice: e.target.value }))}
                    disabled={!form.useCustomPrice}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bypass"
                  checked={form.bypassPhoto}
                  onChange={(e) => setForm((prev) => ({ ...prev, bypassPhoto: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="bypass" className="text-sm">Bypass foto (khusus petugas)</Label>
              </div>
              <p className="text-xs text-slate-500">Jika bypass aktif, foto boleh kosong. Pastikan bukti fisik disimpan oleh petugas.</p>

              {!form.bypassPhoto && (
                <div className="space-y-2">
                  <Label className="text-sm">Foto Paket</Label>
                  <CameraCapture
                    onCapture={(url) => setForm((prev) => ({ ...prev, photoUrl: url }))}
                  />
                  {form.photoUrl && <p className="text-xs text-emerald-700">Foto tersimpan.</p>}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border p-4 bg-white shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-slate-600" />
                  <div>
                    <div className="font-semibold">Aturan Drop Petugas</div>
                    <p className="text-xs text-slate-500">Nomor resi unik, lokasi harus sesuai penerima.</p>
                  </div>
                </div>
                <ul className="list-disc text-xs text-slate-600 pl-4 space-y-1">
                  <li>Pastikan penerima sudah ada, atau tambah via Quick Add.</li>
                  <li>Harga custom hanya berlaku untuk paket ini.</li>
                  <li>Bypass foto hanya boleh saat kurir menolak foto atau rusak.</li>
                </ul>
              </div>

              {errorMessage && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}
              {statusMessage && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{statusMessage}</div>}

              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-12 text-base">
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan...</span>
                ) : (
                  <span className="flex items-center gap-2"><PackagePlus className="h-5 w-5" /> Simpan Paket</span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
