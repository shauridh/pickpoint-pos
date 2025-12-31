import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    return NextResponse.json(session);
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json({}, { status: 401 });
  }
}
