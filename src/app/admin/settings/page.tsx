"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";

type TemplateKey =
  | "package_push"
  | "package_whatsapp"
  | "payment_push"
  | "payment_whatsapp"
  | "reminder_whatsapp";

type TemplateState = Record<TemplateKey, string>;

const defaults: TemplateState = {
  package_push: "📦 HI {name}, Paket anda {receiptNumber} sudah dapat diambil di Pickpoint {location}.",
  package_whatsapp:
    "HI {name}, Paket anda {receiptNumber} sudah dapat diambil di Pickpoint {location}. Untuk detail informasi dapat membuka link berikut {link}",
  payment_push: "✅ Halo {name}, pembayaran membership anda berhasil!",
  payment_whatsapp:
    "Halo {name}, pembayaran membership anda berhasil! Masa aktif member anda telah diperpanjang hingga {expiryDate}. Terima kasih!",
  reminder_whatsapp:
    "Halo {name}, masa aktif membership anda akan segera berakhir pada {expiryDate}. Segera lakukan perpanjangan untuk tetap menikmati layanan kami.",
};

const variables = {
  package: ["{name}", "{receiptNumber}", "{location}", "{link}"],
  payment: ["{name}", "{expiryDate}"],
  reminder: ["{name}", "{expiryDate}"],
};

export default function AdminSettingsPage() {
  const [templates, setTemplates] = useState<TemplateState>(defaults);
  const [saving, setSaving] = useState(false);

  const variableChips = useMemo(
    () => ({
      package: variables.package,
      payment: variables.payment,
      reminder: variables.reminder,
    }),
    []
  );

  const handleChange = (key: TemplateKey, value: string) => {
    setTemplates((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // TODO: connect to backend settings API
    setSaving(true);
    setTimeout(() => setSaving(false), 600);
    console.info("Templates to persist", templates);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Pengaturan template notifikasi & channel</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifikasi Paket Tiba</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Push Notification</p>
              <Input
                value={templates.package_push}
                onChange={(e) => handleChange("package_push", e.target.value)}
              />
              <p className="text-xs text-slate-500">Variabel: {variableChips.package.join(", ")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">WhatsApp</p>
              <Textarea
                value={templates.package_whatsapp}
                onChange={(e) => handleChange("package_whatsapp", e.target.value)}
                rows={5}
              />
              <p className="text-xs text-slate-500">Variabel: {variableChips.package.join(", ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pembayaran Berhasil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Push Notification</p>
              <Input
                value={templates.payment_push}
                onChange={(e) => handleChange("payment_push", e.target.value)}
              />
              <p className="text-xs text-slate-500">Variabel: {variableChips.payment.join(", ")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">WhatsApp</p>
              <Textarea
                value={templates.payment_whatsapp}
                onChange={(e) => handleChange("payment_whatsapp", e.target.value)}
                rows={5}
              />
              <p className="text-xs text-slate-500">Variabel: {variableChips.payment.join(", ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminder Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">WhatsApp</p>
            <Textarea
              value={templates.reminder_whatsapp}
              onChange={(e) => handleChange("reminder_whatsapp", e.target.value)}
              rows={5}
            />
            <p className="text-xs text-slate-500">Variabel: {variableChips.reminder.join(", ")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Template"}
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        Catatan: tombol simpan saat ini hanya menyimpan di memori. Hubungkan ke API settings untuk persist ke database.
      </p>
    </div>
  );
}
