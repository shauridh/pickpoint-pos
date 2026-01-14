"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, Check, RefreshCw, X } from "lucide-react";
import imageCompression from "browser-image-compression";

interface KioskWebcamProps {
  onUpload: (url: string) => void;
  onCancel?: () => void;
  instruction?: string;
}

const videoConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  facingMode: "environment" as const,
};

export function KioskWebcam({ onUpload, onCancel, instruction }: KioskWebcamProps) {
  const webcamRef = useRef<Webcam>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const handleCapture = useCallback(() => {
    setError(null);
    const image = webcamRef.current?.getScreenshot();
    if (!image) {
      setError("Gagal mengambil gambar. Coba lagi.");
      return;
    }
    setSnapshot(image);
    setFilename(`drop-${Date.now()}.jpg`);
  }, []);

  const handleRetake = useCallback(() => {
    setSnapshot(null);
    setError(null);
    setFilename(null);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!snapshot || !filename) return;
    setIsUploading(true);
    setError(null);

    try {
      const blob = await (await fetch(snapshot)).blob();
      const compressedBlob = await imageCompression(blob, {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
        initialQuality: 0.8,
        fileType: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("photo", compressedBlob, filename);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Upload gagal");
      }

      if (!data?.url) {
        throw new Error("URL upload tidak ditemukan");
      }

      onUpload(data.url);
      setSnapshot(null);
      setFilename(null);
    } catch (err) {
      console.error("Upload error", err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengunggah foto. Silakan periksa koneksi dan coba lagi."
      );
    } finally {
      setIsUploading(false);
    }
  }, [filename, onUpload, snapshot]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-slate-900/90 p-4 shadow-inner">
        {!snapshot ? (
          <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-black">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="h-[320px] w-full object-cover"
              videoConstraints={videoConstraints}
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
              <Camera className="h-8 w-8" />
              <p className="text-sm font-medium tracking-wide">
                {instruction || "Pastikan label paket terlihat jelas"}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40">
            <img src={snapshot} alt="Preview paket" className="h-[320px] w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {snapshot ? (
          <>
            <Button variant="outline" className="flex-1" onClick={handleRetake} disabled={isUploading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Foto Ulang
            </Button>
            <Button className="flex-1" onClick={handleUpload} disabled={isUploading}>
              <Check className="mr-2 h-4 w-4" />
              {isUploading ? "Mengunggah..." : "Gunakan Foto"}
            </Button>
          </>
        ) : (
          <>
            <Button className="flex-1" onClick={handleCapture}>
              <Camera className="mr-2 h-4 w-4" />
              Ambil Foto
            </Button>
            {onCancel && (
              <Button variant="ghost" className="flex-1" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
