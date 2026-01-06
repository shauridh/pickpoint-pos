import Link from "next/link";
import { Clock3 } from "lucide-react";

type SearchParams = { [key: string]: string | string[] | undefined };

const getParam = (params: SearchParams, keys: string[]) => {
  for (const key of keys) {
    const value = params[key];
    if (Array.isArray(value)) return value[0];
    if (value) return value;
  }
  return undefined;
};

const formatCurrency = (value?: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numeric);
};

export default async function PaymentPendingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderId = getParam(params, ["order_id", "orderId", "order"]);
  const grossAmount = getParam(params, [
    "gross_amount",
    "grossAmount",
    "amount",
  ]);
  const status =
    getParam(params, [
      "transaction_status",
      "transactionStatus",
      "status",
    ]) || "pending";

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-amber-100 rounded-2xl shadow-lg p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <Clock3 className="h-14 w-14 text-amber-500" aria-hidden />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Menunggu Pembayaran
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Transaksi belum selesai. Silakan lanjutkan pembayaran.
          </h1>
          <p className="text-gray-600">
            Jangan tutup jendela pembayaran jika masih terbuka. Jika sudah tertutup, Anda bisa coba lagi dari dashboard.
          </p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 text-left space-y-2">
          {orderId && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Order ID</span>
              <span className="font-semibold text-gray-900">{orderId}</span>
            </div>
          )}
          {grossAmount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(grossAmount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status</span>
            <span className="font-semibold text-amber-700">{status}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-600 transition"
          >
            Buka Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
