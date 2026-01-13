import "dotenv/config";
import { PrismaClient, Role, Prisma, PackageStatus, PaymentStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Admin user - ridho
  const adminUsername = "ridho";
  const adminPhone = "6282111080802"; // From user comment
  const adminPinPlain = "123456";
  const pinHash = await bcrypt.hash(adminPinPlain, 10);

  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      username: adminUsername,
      name: "Ridho Admin",
      phone: adminPhone,
      unit: "Staff-01",
      apartmentName: "Admin Office",
      pin: pinHash,
      role: Role.ADMIN,
      isMember: false,
    },
  });
  console.log("✅ Admin user created:", adminUsername);

  // Locations with proper pricing configs
  const locations = [
    {
      name: "Apartemen A",
      dropSlug: "apartemen-a",
      price: new Prisma.Decimal(5000),
      pricingScheme: "FLAT" as const,
      gracePeriodDays: 1,
      priceConfig: { basePrice: 5000, penaltyPer24h: 3000 },
      deliveryEnabled: true,
      deliveryPriceConfig: { S: 5000, M: 7000, L: 10000, XL: 15000 }
    },
    {
      name: "Apartemen B",
      dropSlug: "apartemen-b",
      price: new Prisma.Decimal(7000),
      pricingScheme: "FLAT_SIZE" as const,
      gracePeriodDays: 0,
      priceConfig: {
        S: { base: 3000, penalty: 2000 },
        M: { base: 5000, penalty: 3000 },
        L: { base: 7000, penalty: 4000 },
        XL: { base: 10000, penalty: 5000 }
      },
      deliveryEnabled: true,
      deliveryPriceConfig: { S: 5000, M: 7000, L: 10000, XL: 15000 }
    },
    {
      name: "Apartemen C",
      dropSlug: "apartemen-c",
      price: new Prisma.Decimal(9000),
      pricingScheme: "PROGRESSIVE_DAY" as const,
      gracePeriodDays: 1,
      priceConfig: { day1Price: 5000, day2AndAfterPrice: 3000 },
      deliveryEnabled: false,
      deliveryPriceConfig: Prisma.JsonNull
    },
  ];

  const createdLocations = [];
  for (const loc of locations) {
    const location = await prisma.location.upsert({
      where: { name: loc.name },
      update: {
        price: loc.price,
        priceConfig: loc.priceConfig,
        gracePeriodDays: loc.gracePeriodDays,
        deliveryEnabled: loc.deliveryEnabled,
        deliveryPriceConfig: loc.deliveryPriceConfig
      },
      create: {
        name: loc.name,
        dropSlug: loc.dropSlug,
        price: loc.price,
        pricingScheme: loc.pricingScheme,
        gracePeriodDays: loc.gracePeriodDays,
        priceConfig: loc.priceConfig,
        deliveryEnabled: loc.deliveryEnabled,
        deliveryPriceConfig: loc.deliveryPriceConfig
      },
    });
    createdLocations.push(location);
    console.log(`✅ Location created: ${loc.name}`);
  }

  // Membership plans
  const plans = [
    { name: "Member 1 Bulan", price: new Prisma.Decimal(50000), durationInDays: 30, description: "Paket hemat 1 bulan" },
    { name: "Member 3 Bulan", price: new Prisma.Decimal(135000), durationInDays: 90, description: "Hemat 10% untuk 3 bulan" },
    { name: "Member 6 Bulan", price: new Prisma.Decimal(240000), durationInDays: 180, description: "Hemat 20% untuk 6 bulan" },
    { name: "Member 12 Bulan", price: new Prisma.Decimal(450000), durationInDays: 365, description: "Hemat 25% untuk 1 tahun" },
  ];

  for (const p of plans) {
    await prisma.membershipPlan.upsert({
      where: { name: p.name },
      update: { price: p.price, durationInDays: p.durationInDays, description: p.description },
      create: {
        name: p.name,
        price: p.price,
        durationInDays: p.durationInDays,
        description: p.description,
      },
    });
  }
  console.log("✅ Membership plans created");

  // Customer users
  const customers = [
    {
      name: "Andi Wijaya",
      phone: "628123456789",
      unit: "A-101",
      apartmentName: "Apartemen A",
      isMember: true,
      memberExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      name: "Budi Santoso",
      phone: "628234567890",
      unit: "B-202",
      apartmentName: "Apartemen B",
      isMember: false,
    },
    {
      name: "Citra Dewi",
      phone: "628345678901",
      unit: "C-303",
      apartmentName: "Apartemen C",
      isMember: false,
    },
  ];

  const createdCustomers = [];
  for (const customer of customers) {
    const user = await prisma.user.upsert({
      where: { phone: customer.phone },
      update: {},
      create: {
        name: customer.name,
        phone: customer.phone,
        unit: customer.unit,
        apartmentName: customer.apartmentName,
        role: Role.CUSTOMER,
        isMember: customer.isMember,
        memberExpiryDate: customer.memberExpiryDate,
      },
    });
    createdCustomers.push(user);
    console.log(`✅ Customer created: ${customer.name}`);
  }

  // Create packages for customers
  const packages = [
    {
      userId: createdCustomers[0].id, // Andi (Member)
      locationId: createdLocations[0].id, // Apartemen A
      receiptNumber: "JNE123456789",
      courierName: "JNE",
      size: "M" as const,
      basePrice: new Prisma.Decimal(5000),
      paymentStatus: PaymentStatus.PAID,
      status: PackageStatus.PENDING_PICKUP,
      proofPhotoUrl: "https://via.placeholder.com/400x300?text=Package+Photo",
    },
    {
      userId: createdCustomers[1].id, // Budi (Non-member)
      locationId: createdLocations[0].id,
      receiptNumber: "SICEPAT987654",
      courierName: "SiCepat",
      size: "L" as const,
      basePrice: new Prisma.Decimal(5000),
      paymentStatus: PaymentStatus.UNPAID,
      status: PackageStatus.PENDING_PICKUP,
      proofPhotoUrl: "https://via.placeholder.com/400x300?text=Package+Photo",
    },
    {
      userId: createdCustomers[2].id, // Citra
      locationId: createdLocations[1].id, // Apartemen B (FLAT_SIZE)
      receiptNumber: "TIKI555666",
      courierName: "TIKI",
      size: "S" as const,
      basePrice: new Prisma.Decimal(3000),
      paymentStatus: PaymentStatus.UNPAID,
      status: PackageStatus.PENDING_PICKUP,
      proofPhotoUrl: "https://via.placeholder.com/400x300?text=Package+Photo",
    },
  ];

  for (const pkg of packages) {
    await prisma.package.create({
      data: pkg,
    });
  }
  console.log(`✅ ${packages.length} packages created`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📝 Test Credentials:");
  console.log("   Admin Login: username='ridho', password='123456'");
  console.log("   Customer Phone: '628123456789' (Andi - Member)");
  console.log("   Customer Phone: '628234567890' (Budi - Non-member)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

