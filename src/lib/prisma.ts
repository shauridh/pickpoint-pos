import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: typeof prisma };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg(
      new pg.Pool({ connectionString: process.env.DATABASE_URL })
    ),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
