import { NextRequest, NextResponse } from "next/server";
import { uploadImageToSupabase } from "@/lib/supabase-storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo") as File;

    if (!photo) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `package-${Date.now()}.jpg`;
    try {
      const publicUrl = await uploadImageToSupabase(buffer, filename);
      if (!publicUrl) {
        return NextResponse.json({ error: "Upload failed (no URL)" }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        url: publicUrl,
      });
    } catch (err: any) {
      console.error('Upload error detail:', err);
      return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
