/**
 * Script untuk membuat super admin
 * Usage: node scripts/create-admin.js
 */

require('dotenv/config');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new pg.Pool({ 
      connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  ),
});

async function createSuperAdmin() {
  try {
    console.log('🔐 Creating super admin...\n');

    const username = 'ridhos';
    const password = '080802';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log('⚠️  User already exists:', username);
      console.log('Updating password and role...\n');

      await prisma.user.update({
        where: { username },
        data: {
          pin: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      });

      console.log('✅ Super admin updated successfully!');
    } else {
      await prisma.user.create({
        data: {
          username,
          name: 'Super Admin',
          phone: '08080200000', // dummy phone
          pin: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      });

      console.log('✅ Super admin created successfully!');
    }

    console.log('\n📋 Login credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Login at: /admin-login');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
