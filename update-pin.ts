import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Test customer user
  await prisma.user.upsert({
    where: { phone: "082111080802" },
    update: {
      pin: "$2a$10$080VuRd4wty0Md4CAk3KmuI/Fk8sQEKnFLZqYl5huxlsc8aaKCgiy",
      name: "Test User",
    },
    create: {
      phone: "082111080802",
      name: "Test User",
      pin: "$2a$10$080VuRd4wty0Md4CAk3KmuI/Fk8sQEKnFLZqYl5huxlsc8aaKCgiy",
      role: "CUSTOMER",
      unit: "",
      apartmentName: "",
    },
  });
  console.log("✓ Customer user 082111080802 (PIN 123456) ready");

  // Test admin user
  await prisma.user.upsert({
    where: { phone: "081234567890" },
    update: {
      pin: "$2a$10$080VuRd4wty0Md4CAk3KmuI/Fk8sQEKnFLZqYl5huxlsc8aaKCgiy",
      name: "Admin Test",
      username: "admin",
    },
    create: {
      phone: "081234567890",
      name: "Admin Test",
      username: "admin",
      pin: "$2a$10$080VuRd4wty0Md4CAk3KmuI/Fk8sQEKnFLZqYl5huxlsc8aaKCgiy",
      role: "ADMIN",
      unit: "",
      apartmentName: "",
    },
  });
  console.log("✓ Admin user 081234567890 (username: admin, PIN 123456) ready");

  // Super user admin: ridho
  await prisma.user.upsert({
    where: { phone: "6280802" },
    update: {
      pin: "$2a$10$oBbo8fy6Kc7IKJpAFk/MiuxWkFt4IXtPDaBJTdSZXizd6N8VWdpQa",
      name: "ridho",
      role: "ADMIN",
      username: "ridho",
    },
    create: {
      phone: "6280802",
      name: "ridho",
      username: "ridho",
      pin: "$2a$10$oBbo8fy6Kc7IKJpAFk/MiuxWkFt4IXtPDaBJTdSZXizd6N8VWdpQa",
      role: "ADMIN",
      unit: "",
      apartmentName: "",
    },
  });
  console.log("✓ Super user ridho (username: ridho, 6280802, PIN 080802, ADMIN) ready");

  await prisma.$disconnect();
}

main();
