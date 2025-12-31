"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Check } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (photoUrl: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Tidak dapat mengakses kamera");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imageData);
      stopCamera();
    }
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    try {
      const blob = await (await fetch(capturedImage)).blob();
      const formData = new FormData();
      formData.append("photo", blob, `package-${Date.now()}.jpg`);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onCapture(data.url);
      } else {
        alert("Gagal upload foto");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan saat upload");
    } finally {
      setIsUploading(false);
    }
  }, [capturedImage, onCapture]);

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
        {!stream && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Camera className="w-16 h-16 text-gray-400" />
            <Button onClick={startCamera} size="lg" className="h-14 px-8">
              <Camera className="w-5 h-5 mr-2" />
              Buka Kamera
            </Button>
          </div>
        )}

        {stream && !capturedImage && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={stopCamera}
                className="h-12 w-12 rounded-full bg-white"
              >
                <X className="w-6 h-6" />
              </Button>
              <Button
                size="icon"
                onClick={capturePhoto}
                className="h-16 w-16 rounded-full"
              >
                <Camera className="w-8 h-8" />
              </Button>
            </div>
          </>
        )}

        {capturedImage && (
          <>
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={retake}
                className="h-14 px-8 bg-white"
              >
                <X className="w-5 h-5 mr-2" />
                Foto Ulang
              </Button>
              <Button
                size="lg"
                onClick={confirmPhoto}
                disabled={isUploading}
                className="h-14 px-8"
              >
                <Check className="w-5 h-5 mr-2" />
                {isUploading ? "Menyimpan..." : "Konfirmasi"}
              </Button>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
