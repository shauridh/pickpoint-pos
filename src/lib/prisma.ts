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

  // Remove sslmode from URL if exists (we'll set it via ssl config)
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  
  // Configure SSL based on environment
  let sslConfig: boolean | { rejectUnauthorized: boolean } = false;
  
  if (process.env.NODE_ENV === "production") {
    // For Supabase pooler, we need to accept self-signed certificates
    sslConfig = { rejectUnauthorized: false };
  }

  const pool = new pg.Pool({ 
    connectionString: url.toString(),
    max: process.env.VERCEL ? 1 : 10,
    ssl: sslConfig,
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
