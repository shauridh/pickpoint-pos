import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

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

export default function PaymentSuccessPage({
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
    ]) || "settlement";

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-emerald-100 rounded-2xl shadow-lg p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" aria-hidden />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Pembayaran Berhasil
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Terima kasih! Pembayaran Anda sudah dikonfirmasi.
          </h1>
          <p className="text-gray-600">
            Simpan detail transaksi di bawah. Anda dapat menutup halaman ini.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-left space-y-2">
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
            <span className="font-semibold text-emerald-700">{status}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
          >
            Buka Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
