import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.COURIER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration missing COURIER_API_KEY" },
        { status: 500 }
      );
    }

    const payload = await request.json();
    const baseUrl = request.nextUrl.origin;

    const upstreamResponse = await fetch(`${baseUrl}/api/packages/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await upstreamResponse.json().catch(() => null);

    return NextResponse.json(data ?? {}, { status: upstreamResponse.status });
  } catch (error) {
    console.error("Drop proxy error", error);
    return NextResponse.json({ error: "Failed to submit package" }, { status: 500 });
  }
}
