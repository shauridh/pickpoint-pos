"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { ScanLine, X, AlertTriangle } from "lucide-react";

export interface ResiScannerProps {
  onDetected: (value: string) => void;
  onClose: () => void;
  helperText?: string;
}

export function ResiScanner({ onDetected, onClose, helperText }: ResiScannerProps) {
  const scannerId = useMemo(() => `resi-scanner-${Math.random().toString(36).slice(2, 10)}`, []);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const hasResultRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    if (!qrRef.current) return;
    try {
      await qrRef.current.stop();
    } catch (error) {
      console.debug("Scanner stop warning", error);
    }
    try {
      await qrRef.current.clear();
    } catch (error) {
      console.debug("Scanner clear warning", error);
    }
    qrRef.current = null;
  }, []);

  const handleClose = useCallback(async () => {
    await stopScanner();
    onClose();
  }, [onClose, stopScanner]);

  useEffect(() => {
    let isMounted = true;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted) return;

        const instance = new Html5Qrcode(scannerId, { verbose: false });
        qrRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: { width: 260, height: 260 },
            disableFlip: true,
          },
          async (decodedText) => {
            if (!decodedText || hasResultRef.current) return;
            hasResultRef.current = true;
            await stopScanner();
            onDetected(decodedText.trim());
            onClose();
          },
          () => {
            // We intentionally ignore per-frame decode errors.
          }
        );

        if (!hasResultRef.current) {
          setStatus("ready");
        }
      } catch (error) {
        console.error("Failed to init scanner", error);
        setErrorMessage("Scanner tidak dapat digunakan. Silakan gunakan mode manual.");
        setStatus("error");
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      stopScanner().catch(() => null);
    };
  }, [onClose, onDetected, scannerId, stopScanner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Mode Scanner</p>
            <p className="text-xs text-gray-500">Arahkan barcode ke dalam kotak panduan</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Tutup scanner">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-6">
          <div className="rounded-2xl border border-blue-200 bg-slate-900/90 p-4">
            <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-slate-700 bg-black">
              <div id={scannerId} className="h-full w-full" />
              <div className="pointer-events-none absolute inset-4 rounded-2xl border border-white/30">
                <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 border-t border-dashed border-white/40" />
                <div className="absolute inset-y-10 left-1/2 -translate-x-1/2 border-l border-dashed border-white/40" />
              </div>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <ScanLine className="h-12 w-12 text-white/40" />
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-blue-100">
              {status === "ready" && (helperText || "Pegang barcode di area kotak hingga terbaca otomatis")}
              {status === "loading" && "Menyalakan kamera..."}
              {status === "error" && errorMessage}
            </div>
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
