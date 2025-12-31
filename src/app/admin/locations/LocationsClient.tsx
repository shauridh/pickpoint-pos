"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Plus, Edit, Trash2, Loader2, Truck } from "lucide-react";
import { createLocation, updateLocation, deleteLocation } from "@/actions/crud";

type PricingScheme = "FLAT" | "FLAT_SIZE" | "PROGRESSIVE_DAY" | "PROGRESSIVE_PACKAGE";

type Location = {
  id: number;
  name: string;
  dropSlug: string;
  price: string;
  pricingScheme: PricingScheme;
  gracePeriodDays: number;
  priceConfig: any;
  deliveryEnabled: boolean;
  deliveryPriceConfig: any;
  createdAt: string;
};

type FormData = {
  name: string;
  pricingScheme: PricingScheme;
  gracePeriodDays: number;
  priceConfig: any;
  deliveryEnabled: boolean;
  deliveryPriceConfig: any;
};

const PRICING_SCHEMES = [
  { value: "FLAT", label: "Flat (Harga Tetap)" },
  { value: "FLAT_SIZE", label: "Flat Berdasarkan Ukuran" },
  { value: "PROGRESSIVE_DAY", label: "Progresif Hari" },
  { value: "PROGRESSIVE_PACKAGE", label: "Progresif Paket" },
];

const SIZES = ["S", "M", "L", "XL"];

const defaultPriceConfig = {
  FLAT: { basePrice: 5000, penaltyPer24h: 3000 },
  FLAT_SIZE: {
    S: { base: 3000, penalty: 2000 },
    M: { base: 5000, penalty: 3000 },
    L: { base: 7000, penalty: 4000 },
    XL: { base: 10000, penalty: 5000 },
  },
  PROGRESSIVE_DAY: { day1Price: 5000, day2AndAfterPrice: 3000 },
  PROGRESSIVE_PACKAGE: { 
    firstPackagePrice: 5000, 
    additionalPackagePrice: 3000,
    penaltyMode: "ADDITIONAL_PACKAGE"
  },
};

const defaultDeliveryConfig = {
  S: 5000,
  M: 7000,
  L: 10000,
  XL: 15000,
};

export default function LocationsClient({ locations }: { locations: Location[] }) {
  const [data, setData] = useState(locations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    pricingScheme: "FLAT",
    gracePeriodDays: 0,
    priceConfig: defaultPriceConfig.FLAT,
    deliveryEnabled: false,
    deliveryPriceConfig: defaultDeliveryConfig,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingId(location.id);
      setFormData({
        name: location.name,
        pricingScheme: location.pricingScheme,
        gracePeriodDays: location.gracePeriodDays,
        priceConfig: location.priceConfig || defaultPriceConfig[location.pricingScheme],
        deliveryEnabled: location.deliveryEnabled,
        deliveryPriceConfig: location.deliveryPriceConfig || defaultDeliveryConfig,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        pricingScheme: "FLAT",
        gracePeriodDays: 0,
        priceConfig: defaultPriceConfig.FLAT,
        deliveryEnabled: false,
        deliveryPriceConfig: defaultDeliveryConfig,
      });
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleSchemeChange = (scheme: PricingScheme) => {
    setFormData({
      ...formData,
      pricingScheme: scheme,
      priceConfig: defaultPriceConfig[scheme],
    });
  };

  const handleSubmit = () => {
    setError(null);

    if (!formData.name.trim()) {
      setError("Nama lokasi harus diisi");
      return;
    }

    startTransition(async () => {
      const result = editingId
        ? await updateLocation(editingId, formData)
        : await createLocation(formData);

      if (!result.success) {
        setError(result.message || "Terjadi kesalahan");
        return;
      }

      setDialogOpen(false);
      window.location.reload();
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Yakin hapus lokasi ini?")) return;
    startTransition(async () => {
      const result = await deleteLocation(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.message || "Gagal hapus lokasi");
      }
    });
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSchemeLabel = (scheme: PricingScheme) => {
    return PRICING_SCHEMES.find((s) => s.value === scheme)?.label || scheme;
  };

  const getSchemeSummary = (location: Location) => {
    const config = location.priceConfig;
    switch (location.pricingScheme) {
      case "FLAT":
        return `Base: ${formatMoney(config.basePrice)} | Penalty: ${formatMoney(config.penaltyPer24h)}/24h`;
      case "FLAT_SIZE":
        return `S: ${formatMoney(config.S.base)} | M: ${formatMoney(config.M.base)} | L: ${formatMoney(config.L.base)} | XL: ${formatMoney(config.XL.base)}`;
      case "PROGRESSIVE_DAY":
        return `Hari 1: ${formatMoney(config.day1Price)} | Hari 2+: ${formatMoney(config.day2AndAfterPrice)}`;
      case "PROGRESSIVE_PACKAGE":
        return `Paket 1: ${formatMoney(config.firstPackagePrice)} | Paket 2+: ${formatMoney(config.additionalPackagePrice)}`;
      default:
        return "-";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Locations</h1>
          <p className="text-slate-600">Kelola lokasi dan skema harga</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Tambah Lokasi
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((location) => (
          <Card key={location.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
                {location.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">
                  {getSchemeLabel(location.pricingScheme)}
                </div>
                <div className="text-xs text-slate-600">
                  {getSchemeSummary(location)}
                </div>
                <div className="text-xs text-slate-500">
                  Grace Period: {location.gracePeriodDays} hari
                </div>
                {location.deliveryEnabled && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <Truck className="w-3 h-3" />
                    <span>Delivery tersedia</span>
                  </div>
                )}
              </div>

              {/* Drop Link Section */}
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs font-semibold text-slate-700 mb-2">Drop Link & QR</div>
                <div className="space-y-1">
                  <div className="text-xs bg-slate-100 p-2 rounded font-mono break-all">
                    https://drop.pickpoint.my.id/drop/{location.dropSlug}
                  </div>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      `https://drop.pickpoint.my.id/drop/${location.dropSlug}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-block"
                  >
                    Buka QR Code
                  </a>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(location)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(location.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Lokasi" : "Tambah Lokasi"}</DialogTitle>
            <DialogDescription>
              Atur nama lokasi, skema harga, dan opsi pengiriman
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
            )}

            {/* Nama Lokasi */}
            <div className="space-y-2">
              <Label>Nama Lokasi</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Rak A, Lantai 1"
              />
            </div>

            {/* Grace Period */}
            <div className="space-y-2">
              <Label>Grace Period (Hari)</Label>
              <Input
                type="number"
                min="0"
                value={formData.gracePeriodDays}
                onChange={(e) =>
                  setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) || 0 })
                }
                placeholder="0 = berbayar hari kedatangan"
              />
              <p className="text-xs text-slate-500">
                0 = berbayar di hari kedatangan, 1 = berbayar setelah 1 hari, dst
              </p>
            </div>

            {/* Pricing Scheme */}
            <div className="space-y-2">
              <Label>Skema Harga</Label>
              <Select value={formData.pricingScheme} onValueChange={handleSchemeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICING_SCHEMES.map((scheme) => (
                    <SelectItem key={scheme.value} value={scheme.value}>
                      {scheme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Price Configuration */}
            <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
              <h4 className="font-medium text-sm">Konfigurasi Harga</h4>

              {formData.pricingScheme === "FLAT" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Harga Base</Label>
                    <Input
                      type="number"
                      value={formData.priceConfig.basePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priceConfig: {
                            ...formData.priceConfig,
                            basePrice: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Penalty per 24 Jam</Label>
                    <Input
                      type="number"
                      value={formData.priceConfig.penaltyPer24h}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priceConfig: {
                            ...formData.priceConfig,
                            penaltyPer24h: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {formData.pricingScheme === "FLAT_SIZE" && (
                <div className="space-y-3">
                  {SIZES.map((size) => (
                    <div key={size} className="grid grid-cols-3 gap-2 items-center">
                      <Label className="font-bold">{size}</Label>
                      <div className="space-y-1">
                        <Label className="text-xs">Base</Label>
                        <Input
                          type="number"
                          value={formData.priceConfig[size].base}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              priceConfig: {
                                ...formData.priceConfig,
                                [size]: {
                                  ...formData.priceConfig[size],
                                  base: parseInt(e.target.value) || 0,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Penalty/24h</Label>
                        <Input
                          type="number"
                          value={formData.priceConfig[size].penalty}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              priceConfig: {
                                ...formData.priceConfig,
                                [size]: {
                                  ...formData.priceConfig[size],
                                  penalty: parseInt(e.target.value) || 0,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.pricingScheme === "PROGRESSIVE_DAY" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Harga Hari Pertama</Label>
                    <Input
                      type="number"
                      value={formData.priceConfig.day1Price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priceConfig: {
                            ...formData.priceConfig,
                            day1Price: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Harga Hari Ke-2 dst</Label>
                    <Input
                      type="number"
                      value={formData.priceConfig.day2AndAfterPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priceConfig: {
                            ...formData.priceConfig,
                            day2AndAfterPrice: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {formData.pricingScheme === "PROGRESSIVE_PACKAGE" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Paket Pertama</Label>
                      <Input
                        type="number"
                        value={formData.priceConfig.firstPackagePrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priceConfig: {
                              ...formData.priceConfig,
                              firstPackagePrice: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Paket Tambahan</Label>
                      <Input
                        type="number"
                        value={formData.priceConfig.additionalPackagePrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priceConfig: {
                              ...formData.priceConfig,
                              additionalPackagePrice: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mode Penalty Hari Berikutnya</Label>
                    <Select
                      value={formData.priceConfig.penaltyMode}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          priceConfig: {
                            ...formData.priceConfig,
                            penaltyMode: val,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIRST_PACKAGE">Pakai Harga Paket Pertama</SelectItem>
                        <SelectItem value="ADDITIONAL_PACKAGE">Pakai Harga Paket Tambahan</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Counter reset setiap 23:59. Penalty dihitung sesuai mode yang dipilih.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Options */}
            <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deliveryEnabled"
                  checked={formData.deliveryEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryEnabled: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="deliveryEnabled" className="cursor-pointer">
                  Aktifkan Opsi Pengantaran ke Unit
                </Label>
              </div>

              {formData.deliveryEnabled && (
                <div className="space-y-3 mt-3">
                  <p className="text-sm text-slate-600">Harga Pengantaran per Ukuran</p>
                  <div className="grid grid-cols-2 gap-3">
                    {SIZES.map((size) => (
                      <div key={size} className="flex items-center gap-2">
                        <Label className="w-8 font-bold">{size}</Label>
                        <Input
                          type="number"
                          value={formData.deliveryPriceConfig[size]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliveryPriceConfig: {
                                ...formData.deliveryPriceConfig,
                                [size]: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Customer akan memilih opsi delivery saat pembayaran paket
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
