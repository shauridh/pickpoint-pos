import midtransClient from "midtrans-client";

const serverKey = process.env.MIDTRANS_SERVER_KEY!;
const clientKey = process.env.MIDTRANS_CLIENT_KEY!;
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

// Create Snap API instance
export const snap = new midtransClient.Snap({
  isProduction,
  serverKey,
  clientKey,
});

// Create Core API instance (for direct API calls)
export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey,
  clientKey,
});

/**
 * Generate Snap token for payment
 */
export async function generateSnapToken(params: {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    firstName: string;
    email?: string;
    phone: string;
  };
  itemDetails: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}): Promise<string> {
  try {
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      customer_details: params.customerDetails,
      item_details: params.itemDetails,
      credit_card: {
        secure: true,
      },
    });

    return transaction.token;
  } catch (error) {
    console.error("Error generating Snap token:", error);
    throw error;
  }
}

/**
 * Verify Midtrans notification signature
 */
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const crypto = require("crypto");
  const input = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const hash = crypto.createHash("sha512").update(input).digest("hex");
  return hash === signatureKey;
}

/**
 * Check transaction status from Midtrans
 */
export async function checkTransactionStatus(orderId: string) {
  try {
    const status = await coreApi.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error("Error checking transaction status:", error);
    throw error;
  }
}
