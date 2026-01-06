/**
 * WhatsApp Gateway Integration
 * Supports sending notifications via WhatsApp API
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WHATSAPP_SENDER = process.env.WHATSAPP_SENDER;

interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., 628123456789)
  message: string;
}

/**
 * Send WhatsApp message
 * Note: This is a generic implementation. Adjust based on your WhatsApp gateway provider.
 */
export async function sendWhatsAppMessage(
  params: WhatsAppMessage
): Promise<{ success: boolean; error?: string }> {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY || !WHATSAPP_SENDER) {
    console.warn("WhatsApp API not configured");
    return { success: false, error: "WhatsApp API not configured" };
  }

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_API_KEY}`,
      },
      body: JSON.stringify({
        sender: WHATSAPP_SENDER,
        number: params.to,
        message: params.message,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WhatsApp API error: ${response.status} ${text}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format phone number for WhatsApp (remove leading 0, add 62)
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with 62
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  // If doesn't start with 62, add it
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}

/**
 * Send package arrival notification via WhatsApp
 */
export async function notifyPackageArrivalWhatsApp(
  phone: string,
  name: string,
  receiptNumber: string,
  locationName: string
): Promise<void> {
  const formattedPhone = formatWhatsAppNumber(phone);
  const link = `${process.env.NEXT_PUBLIC_APP_URL || "https://pickpoint.my.id"}/dashboard`;
  const message = `HI ${name}, \n\nPaket anda ${receiptNumber} sudah dapat diambil di Pickpoint ${locationName}.\n\nUntuk detail informasi dapat mebuka link berikut ${link}`;

  await sendWhatsAppMessage({
    to: formattedPhone,
    message,
  });
}

/**
 * Send payment success notification via WhatsApp
 */
export async function notifyMembershipSuccessWhatsApp(
  phone: string,
  name: string,
  expiryDate: Date
): Promise<void> {
  const formattedPhone = formatWhatsAppNumber(phone);
  const formattedDate = expiryDate.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const message = `Halo ${name},\n\npembayaran membership anda berhasil! Masa aktif member anda telah diperpanjang hingga ${formattedDate}. Terima kasih!`;

  await sendWhatsAppMessage({
    to: formattedPhone,
    message,
  });
}

/**
 * Send membership reminder via WhatsApp
 */
export async function notifyMembershipReminderWhatsApp(
  phone: string,
  name: string,
  expiryDate: Date
): Promise<void> {
  const formattedPhone = formatWhatsAppNumber(phone);
  const formattedDate = expiryDate.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const message = `Halo ${name},\n\nmasa aktif membership anda akan segera berakhir pada ${formattedDate}. Segera lakukan perpanjangan untuk tetap menikmati layanan kami.`;

  await sendWhatsAppMessage({
    to: formattedPhone,
    message,
  });
}

/**
 * Send payment reminder via WhatsApp
 */
export async function sendPaymentReminderWhatsApp(
  phone: string,
  name: string,
  receiptNumber: string,
  amount: number,
  daysOverdue: number
): Promise<void> {
  const formattedPhone = formatWhatsAppNumber(phone);
  const message = `Halo ${name},\n\n⏰ Reminder: Paket dengan resi ${receiptNumber} memiliki tagihan sebesar Rp ${amount.toLocaleString(
    "id-ID"
  )}.\n\nPaket sudah ${daysOverdue} hari di tempat kami. Mohon segera lakukan pembayaran.\n\nTerima kasih,\nPickPoint`;

  await sendWhatsAppMessage({
    to: formattedPhone,
    message,
  });
}
