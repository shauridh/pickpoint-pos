import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create connection pool dengan fallback direct URL jika tersedia
function createPrismaClient() {
  const useDirect =
    !!process.env.DIRECT_DATABASE_URL &&
    (process.env.VERCEL === "1" || process.env.NODE_ENV === "production");

  const rawConnectionString = useDirect
    ? process.env.DIRECT_DATABASE_URL
    : process.env.DATABASE_URL;

  if (!rawConnectionString) {
    throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be defined");
  }

  const url = new URL(rawConnectionString);
  url.searchParams.delete("sslmode");

  const pool = new pg.Pool({
    connectionString: url.toString(),
    max: process.env.VERCEL ? 1 : 10,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
