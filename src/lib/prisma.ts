import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create connection pool dengan error handling
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  // Parse connection string untuk modify SSL mode
  const url = new URL(connectionString);
  
  // Untuk production, gunakan direct SSL connection
  if (process.env.NODE_ENV === "production") {
    url.searchParams.set("sslmode", "require");
  }

  const pool = new pg.Pool({ 
    connectionString: url.toString(),
    max: process.env.VERCEL ? 1 : 10,
    ssl: process.env.NODE_ENV === "production" 
      ? { rejectUnauthorized: false } 
      : false,
    // Add connection timeout
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
