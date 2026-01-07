/**
 * WhatsApp Notification Test Script
 * 
 * Cara pakai:
 * 1. Pastikan .env.local sudah ada konfigurasi:
 *    WHATSAPP_API_URL=https://api.fonnte.com/send (atau provider lain)
 *    WHATSAPP_API_KEY=your_api_key
 *    WHATSAPP_SENDER=your_sender_number
 * 
 * 2. Jalankan: npx tsx test-whatsapp.ts
 */

import "dotenv/config";

// Import fungsi notifikasi
import {
    notifyPackageArrivalWhatsApp,
    notifyMembershipSuccessWhatsApp,
    notifyMembershipReminderWhatsApp
} from "./src/lib/whatsapp";

async function testWhatsAppNotifications() {
    console.log("🧪 Testing WhatsApp Notifications...\n");

    // Ganti dengan nomor HP test kamu (format: 628xxx)
    const TEST_PHONE = "6282111080802"; // GANTI INI!
    const TEST_NAME = "Budi Santoso";
    const TEST_RESI = "JNE123456789";
    const TEST_LOCATION = "Apartemen Sudirman";

    console.log("📱 Nomor test:", TEST_PHONE);
    console.log("---\n");

    // Test 1: Notifikasi Paket Tiba
    console.log("1️⃣ Testing Package Arrival Notification...");
    try {
        const result1 = await notifyPackageArrivalWhatsApp(
            TEST_PHONE,
            TEST_NAME,
            TEST_RESI,
            TEST_LOCATION
        );
        console.log("   Result:", result1.success ? "✅ SUCCESS" : "❌ FAILED");
        if (!result1.success) console.log("   Error:", result1.error);
    } catch (error) {
        console.log("   ❌ Exception:", error);
    }
    console.log("");

    // Test 2: Notifikasi Membership Success
    console.log("2️⃣ Testing Membership Success Notification...");
    try {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        const result2 = await notifyMembershipSuccessWhatsApp(
            TEST_PHONE,
            TEST_NAME,
            expiryDate
        );
        console.log("   Result:", result2.success ? "✅ SUCCESS" : "❌ FAILED");
        if (!result2.success) console.log("   Error:", result2.error);
    } catch (error) {
        console.log("   ❌ Exception:", error);
    }
    console.log("");

    // Test 3: Notifikasi Membership Reminder
    console.log("3️⃣ Testing Membership Reminder Notification...");
    try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 3); // 3 hari lagi

        const result3 = await notifyMembershipReminderWhatsApp(
            TEST_PHONE,
            TEST_NAME,
            expiryDate
        );
        console.log("   Result:", result3.success ? "✅ SUCCESS" : "❌ FAILED");
        if (!result3.success) console.log("   Error:", result3.error);
    } catch (error) {
        console.log("   ❌ Exception:", error);
    }
    console.log("");

    console.log("✨ Test selesai!");
    console.log("\n📝 Catatan:");
    console.log("- Jika semua FAILED dengan 'WhatsApp API not configured', cek .env.local");
    console.log("- Jika ada error API, cek kredensial WhatsApp Gateway");
    console.log("- Jika SUCCESS, cek HP untuk menerima pesan WA");
}

// Run test
testWhatsAppNotifications().catch(console.error);
