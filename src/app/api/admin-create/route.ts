import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const username = "ridhos";
    const password = "080802";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { username },
        data: {
          pin: hashedPassword,
          role: "ADMIN",
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Super admin updated successfully",
        username,
        loginUrl: "/admin-login",
      });
    } else {
      await prisma.user.create({
        data: {
          username,
          name: "Super Admin",
          phone: "08080200000",
          pin: hashedPassword,
          role: "ADMIN",
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Super admin created successfully",
        username,
        loginUrl: "/admin-login",
      });
    }
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to create admin",
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
