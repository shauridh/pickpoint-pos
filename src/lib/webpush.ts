import webpush from "web-push";
import { prisma } from "./prisma";

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:noreply@pickpoint.my.id";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

/**
 * Send push notification to a specific user
 */
export async function sendNotification(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    // Get user's push subscriptions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true },
    });

    if (!user?.pushSubscription) {
      console.log(`No push subscription found for user ${userId}`);
      return { success: false, sent: 0, failed: 0 };
    }

    // Parse subscription (can be array or single object)
    const subscriptions = Array.isArray(user.pushSubscription)
      ? user.pushSubscription
      : [user.pushSubscription];

    let sent = 0;
    let failed = 0;

    // Send to all subscriptions
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          subscription as any,
          JSON.stringify(payload)
        );
        sent++;
      } catch (error: any) {
        console.error(`Failed to send notification:`, error);
        
        // Remove invalid subscriptions (410 = subscription expired)
        if (error.statusCode === 410) {
          console.log(`Removing expired subscription for user ${userId}`);
          // In production, implement logic to remove this specific subscription
        }
        failed++;
      }
    }

    return { success: sent > 0, sent, failed };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Send notification about new package arrival
 */
export async function notifyPackageArrival(
  userId: string,
  receiptNumber: string,
  locationName: string
): Promise<void> {
  await sendNotification(userId, {
    title: "📦 Paket Tiba!",
    body: `Paket dengan resi ${receiptNumber} telah diterima di ${locationName}`,
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: {
      url: "/dashboard",
      type: "package_arrival",
      receiptNumber,
    },
  });
}

/**
 * Send notification about payment success
 */
export async function notifyPaymentSuccess(
  userId: string,
  amount: number,
  type: "package" | "membership"
): Promise<void> {
  const message =
    type === "package"
      ? `Pembayaran paket sebesar Rp ${amount.toLocaleString("id-ID")} berhasil`
      : `Pembayaran membership sebesar Rp ${amount.toLocaleString("id-ID")} berhasil`;

  await sendNotification(userId, {
    title: "✅ Pembayaran Berhasil",
    body: message,
    icon: "/icon-192x192.png",
    data: {
      url: "/dashboard",
      type: "payment_success",
    },
  });
}
