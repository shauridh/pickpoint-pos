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
  package_push: "📦 Paket {receiptNumber} tiba di {location}.",
  package_whatsapp:
    "Halo {name},\n\nPaket dengan resi {receiptNumber} sudah tiba di {location}.\nSilakan ambil di jam operasional.\n\nTerima kasih, PickPoint",
  payment_push: "✅ Pembayaran {type} berhasil sebesar {amount}.",
  payment_whatsapp:
    "Halo {name},\n\nPembayaran {type} sebesar {amount} sudah diterima.\nTerima kasih telah menggunakan PickPoint!",
  reminder_whatsapp:
    "Halo {name},\n\nPaket {receiptNumber} menunggu pembayaran sebesar {amount}.\nSudah {days} hari di lokasi. Mohon segera diselesaikan, ya.",
};

const variables = {
  package: ["{name}", "{receiptNumber}", "{location}"],
  payment: ["{name}", "{amount}", "{type}"],
  reminder: ["{name}", "{receiptNumber}", "{amount}", "{days}"],
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
