"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DropIndexPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="max-w-sm w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Pilih Lokasi Drop</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>Silakan buka tautan atau scan QR khusus lokasi tempat paket diterima.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>/drop/apartemen-a</li>
            <li>/drop/apartemen-b</li>
          </ul>
          <p className="text-xs text-gray-500">Tanya admin untuk QR/tautan lokasi yang benar agar tidak salah apartemen.</p>
        </CardContent>
      </Card>
    </div>
  );
}
