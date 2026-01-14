"use client";

import React, { useState, useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Crown, Plus, Edit, Trash2, Loader2, Bell } from "lucide-react";
import { createCustomer, updateCustomer, deleteCustomer } from "@/actions/crud";
import { sendMembershipReminder } from "@/actions/membership";

type Customer = {
  id: string;
  name: string;
  phone: string;
  unit: string;
  apartmentName: string;
  isMember: boolean;
  memberExpiryDate: string | null;
  createdAt: string;
};

type Location = {
  id: number;
  name: string;
};

type FormData = {
  name: string;
  phone: string;
  unit: string;
  apartmentName: string;
  pin?: string;
};

export default function CustomersClient({ customers, locations }: { customers: Customer[]; locations: Location[] }) {
  const [data, setData] = useState(customers);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    unit: "",
    apartmentName: locations[0]?.name ?? "",
    pin: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.unit.toLowerCase().includes(q) ||
        c.apartmentName.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        unit: customer.unit,
        apartmentName: customer.apartmentName,
        pin: ""
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", phone: "", unit: "", apartmentName: locations[0]?.name ?? "", pin: "" });
    }
    setError(null);
    setDialogOpen(true);
  };
        {editingId && (
          <div className="space-y-2">
            <Label>Reset PIN (opsional, 6 digit)</Label>
            <Input
              type="password"
              value={formData.pin || ""}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, "").slice(0, 6) })}
              placeholder="Masukkan PIN baru"
              maxLength={6}
            />
            <span className="text-xs text-muted-foreground">Kosongkan jika tidak ingin reset PIN</span>
          </div>
        )}

  const handleSubmit = () => {
    setError(null);
    if (!formData.apartmentName) {
      setError("Lokasi/apartemen wajib dipilih");
      return;
    }
    startTransition(async () => {
      let submitData = { ...formData };
      // Validasi PIN jika diisi
      if (editingId && submitData.pin && submitData.pin.length === 6) {
        // PIN valid, kirim ke backend
      } else if (editingId) {
        // Jangan kirim field pin jika kosong
        delete submitData.pin;
      }
      const result = editingId
        ? await updateCustomer(editingId, submitData)
        : await createCustomer(submitData);

      if (!result.success) {
        setError(result.message || "Terjadi kesalahan");
        return;
      }

      setDialogOpen(false);
      window.location.reload();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Yakin hapus customer ini? Customer tidak dapat dihapus jika masih memiliki paket.")) return;
    startTransition(async () => {
      const result = await deleteCustomer(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.message || "Gagal hapus customer");
      }
    });
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleSendReminder = (id: string) => {
    startTransition(async () => {
      const result = await sendMembershipReminder(id);
      alert(result.message);
    });
  };

  const isMemberActive = (expiry: string | null) => {
    if (!expiry) return false;
    return new Date(expiry) > new Date();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600">Kelola data pelanggan</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Daftar Customer ({filtered.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari nama, HP, unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="pb-3 pr-4 font-medium">Nama</th>
                  <th className="pb-3 pr-4 font-medium">No HP</th>
                  <th className="pb-3 pr-4 font-medium">Unit</th>
                  <th className="pb-3 pr-4 font-medium">Apartemen</th>
                  <th className="pb-3 pr-4 font-medium">Member</th>
                  <th className="pb-3 pr-4 font-medium">Terdaftar</th>
                  <th className="pb-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer) => (
                    <tr key={customer.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {customer.name}
                          </span>
                          {customer.isMember &&
                            isMemberActive(customer.memberExpiryDate) && (
                              <Crown className="w-4 h-4 text-amber-500" />
                            )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{customer.phone}</td>
                      <td className="py-3 pr-4 text-slate-700">{customer.unit}</td>
                      <td className="py-3 pr-4 text-slate-700">
                        {customer.apartmentName || "-"}
                      </td>
                      <td className="py-3 pr-4">
                        {customer.isMember &&
                          isMemberActive(customer.memberExpiryDate) ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            Aktif s/d{" "}
                            {customer.memberExpiryDate &&
                              formatDate(customer.memberExpiryDate)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Non-member</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 text-xs">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {customer.isMember && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendReminder(customer.id)}
                              disabled={isPending}
                              title="Kirim Pengingat Masa Aktif"
                            >
                              <Bell className="w-3 h-3 text-sky-600" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(customer)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Customer" : "Tambah Customer"}
            </DialogTitle>
            <DialogDescription>
              Isi data customer dengan lengkap
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>No HP</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                placeholder="A-101"
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Apartemen / Lokasi</Label>
              <Select
                value={formData.apartmentName}
                onValueChange={(val) => setFormData({ ...formData, apartmentName: val })}
                disabled={locations.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={locations.length ? "Pilih lokasi" : "Lokasi belum ada"} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingId ? (
                "Update"
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