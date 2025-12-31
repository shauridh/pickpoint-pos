import "dotenv/config";
import { PrismaClient, Role, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin user
  const adminPhone = "+620000000000";
  const adminPinPlain = "123456";
  const pinHash = await bcrypt.hash(adminPinPlain, 10);

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      name: "Admin",
      phone: adminPhone,
      unit: "A-01",
      apartmentName: "Admin Office",
      pin: pinHash,
      role: Role.ADMIN,
      isMember: false,
    },
  });

  // Locations
  const locations = [
    { name: "Apartemen A", price: new Prisma.Decimal(5000) },
    { name: "Apartemen B", price: new Prisma.Decimal(7000) },
    { name: "Apartemen C", price: new Prisma.Decimal(9000) },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: { price: loc.price },
      create: { name: loc.name, price: loc.price },
    });
  }

  // Membership plans (1, 3, 6, 12 months)
  const plans = [
    { name: "Member 1 Bulan", price: new Prisma.Decimal(50000), durationInDays: 30 },
    { name: "Member 3 Bulan", price: new Prisma.Decimal(135000), durationInDays: 90 },
    { name: "Member 6 Bulan", price: new Prisma.Decimal(240000), durationInDays: 180 },
    { name: "Member 12 Bulan", price: new Prisma.Decimal(450000), durationInDays: 365 },
  ];

  for (const p of plans) {
    await prisma.membershipPlan.upsert({
      where: { name: p.name },
      update: { price: p.price, durationInDays: p.durationInDays },
      create: {
        name: p.name,
        price: p.price,
        durationInDays: p.durationInDays,
      },
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
