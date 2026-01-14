import { NextRequest, NextResponse } from "next/server";
import { uploadImageToSupabase } from "@/lib/supabase-storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo") as File;

    if (!photo) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Foto terlalu besar (maks 5MB)" }, { status: 413 });
    }

    if (!ALLOWED_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: "Format foto tidak didukung" }, { status: 415 });
    }

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = photo.type.split("/")[1] ?? "jpg";
    const filename = `package-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    try {
      const { publicUrl } = await uploadImageToSupabase({
        buffer,
        filename,
        contentType: photo.type,
        folder: "drops",
      });

      return NextResponse.json({
        success: true,
        url: publicUrl,
      });
    } catch (err: any) {
      console.error("Upload error detail:", err);
      return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
