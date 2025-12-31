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
  const message = `Halo ${name},\n\n📦 Paket Anda telah tiba!\n\nNomor Resi: ${receiptNumber}\nLokasi: ${locationName}\n\nSilakan ambil paket Anda di lokasi tersebut.\n\nTerima kasih,\nPickPoint`;

  await sendWhatsAppMessage({
    to: formattedPhone,
    message,
  });
}

/**
 * Send payment success notification via WhatsApp
 */
export async function notifyPaymentSuccessWhatsApp(
  phone: string,
  name: string,
  amount: number,
  type: "package" | "membership"
): Promise<void> {
  const formattedPhone = formatWhatsAppNumber(phone);
  const typeText = type === "package" ? "paket" : "membership";
  const message = `Halo ${name},\n\n✅ Pembayaran ${typeText} Anda sebesar Rp ${amount.toLocaleString(
    "id-ID"
  )} telah berhasil.\n\nTerima kasih,\nPickPoint`;

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
