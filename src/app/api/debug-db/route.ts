import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test raw query
    const result = await prisma.$queryRaw`SELECT NOW() as time, version() as version`;
    
    // Try to count users
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      database: result,
      userCount,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
      }
    });
  } catch (error) {
    console.error("Database debug error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        env: {
          hasDbUrl: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV,
          isVercel: !!process.env.VERCEL,
        }
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
