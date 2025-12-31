import Link from "next/link";
import { AlertTriangle } from "lucide-react";

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

export default function PaymentErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const orderId = getParam(searchParams, ["order_id", "orderId", "order"]);
  const grossAmount = getParam(searchParams, [
    "gross_amount",
    "grossAmount",
    "amount",
  ]);
  const status =
    getParam(searchParams, [
      "transaction_status",
      "transactionStatus",
      "status",
    ]) || "failed";
  const message = getParam(searchParams, ["status_message", "statusMessage", "message"]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-rose-100 rounded-2xl shadow-lg p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-14 w-14 text-rose-500" aria-hidden />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
            Pembayaran Gagal
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Terjadi kendala pada pembayaran.
          </h1>
          <p className="text-gray-600">
            Silakan coba ulang pembayaran atau gunakan metode lain. Jika saldo sudah terpotong, sistem akan memperbarui status otomatis setelah Midtrans mengirim notifikasi.
          </p>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50 px-5 py-4 text-left space-y-2">
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
            <span className="font-semibold text-rose-700">{status}</span>
          </div>
          {message && (
            <div className="text-xs text-rose-700 pt-1">{message}</div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-rose-600 transition"
          >
            Coba Lagi
          </Link>
        </div>
      </div>
    </main>
  );
}
