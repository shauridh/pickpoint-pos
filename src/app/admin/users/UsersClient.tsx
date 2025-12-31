"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserCog, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { createStaffUser, updateStaffUser, deleteStaffUser } from "@/actions/crud";

type User = {
  id: string;
  name: string;
  phone: string;
  role: string;
  locationId: number | null;
  locationName: string | null;
  createdAt: string;
};

type Location = {
  id: number;
  name: string;
};

type FormData = {
  name: string;
  phone: string;
  role: string;
  pin: string;
  locationId: number | null;
};

export default function UsersClient({ users, locations }: { users: User[]; locations: Location[] }) {
  const [data, setData] = useState(users);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    role: "STAFF",
    pin: "",
    locationId: locations[0]?.id ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        name: user.name,
        phone: user.phone,
        role: user.role,
        pin: "",
        locationId: user.locationId ?? locations[0]?.id ?? null,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        phone: "",
        role: "STAFF",
        pin: "",
        locationId: locations[0]?.id ?? null,
      });
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    setError(null);
    if (!editingId && !formData.pin) {
      setError("PIN wajib diisi untuk user baru");
      return;
    }

    if (formData.role === "STAFF" && !formData.locationId) {
      setError("Lokasi wajib dipilih untuk staff");
      return;
    }

    startTransition(async () => {
      const result = editingId
        ? await updateStaffUser(editingId, {
            name: formData.name,
            phone: formData.phone,
            role: formData.role as "STAFF" | "ADMIN",
            locationId: formData.role === "STAFF" ? formData.locationId : null,
            ...(formData.pin && { pin: formData.pin }),
          })
        : await createStaffUser({
            name: formData.name,
            phone: formData.phone,
            role: formData.role as "STAFF" | "ADMIN",
            pin: formData.pin,
            locationId: formData.role === "STAFF" ? formData.locationId ?? undefined : undefined,
          });

      if (!result.success) {
        setError(result.message || "Terjadi kesalahan");
        return;
      }

      setDialogOpen(false);
      window.location.reload();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Yakin hapus user ini?")) return;
    startTransition(async () => {
      const result = await deleteStaffUser(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.message || "Gagal hapus user");
      }
    });
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    STAFF: "Staff",
  };

  const roleIcons: Record<string, any> = {
    ADMIN: ShieldCheck,
    STAFF: UserCog,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-600">Kelola admin dan staff</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar User ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="pb-3 pr-4 font-medium">Nama</th>
                  <th className="pb-3 pr-4 font-medium">No HP</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Lokasi</th>
                  <th className="pb-3 pr-4 font-medium">Terdaftar</th>
                  <th className="pb-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada user
                    </td>
                  </tr>
                ) : (
                  data.map((user) => {
                    const Icon = roleIcons[user.role] || UserCog;
                    return (
                      <tr
                        key={user.id}
                        className="border-b last:border-0 hover:bg-slate-50"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {user.name}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{user.phone}</td>
                        <td className="py-3 pr-4">
                          <Badge
                            className={`flex items-center gap-1 w-fit ${
                              user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {user.role === "ADMIN" ? "-" : user.locationName || "-"}
                        </td>
                        <td className="py-3 pr-4 text-slate-600 text-xs">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(user)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Tambah User"}</DialogTitle>
            <DialogDescription>
              Isi data admin/staff. PIN akan di-hash otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="081234567890"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(val: string) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: val,
                    locationId: val === "ADMIN" ? null : prev.locationId ?? locations[0]?.id ?? null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">STAFF</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lokasi (untuk Staff)</Label>
              <Select
                value={formData.locationId ? String(formData.locationId) : ""}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, locationId: val ? Number(val) : null }))
                }
                disabled={formData.role !== "STAFF" || locations.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={locations.length ? "Pilih lokasi" : "Lokasi belum ada"} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PIN {editingId && "(kosongkan jika tidak ingin ubah)"}</Label>
              <Input
                type="password"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="4-6 digit"
              />
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
