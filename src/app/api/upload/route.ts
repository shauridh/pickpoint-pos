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
    const publicUrl = await uploadImageToSupabase(buffer, filename);
    if (!publicUrl) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
