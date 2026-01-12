import Link from "next/link";
import { ArrowRight, Bell, Box, CreditCard, Smartphone, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-16">
        {/* Hero */}
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-900/40 px-4 py-2 text-sm text-emerald-200 ring-1 ring-emerald-500/40">
              <Zap className="h-4 w-4" />
              Smart Package Ops untuk Apartemen
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Automasi pengelolaan paket dengan notifikasi instan & pembayaran terintegrasi.
            </h1>
            <p className="text-slate-200 text-lg leading-relaxed">
              PickPoint menyatukan drop-off portal, dashboard admin, pembayaran Midtrans, dan notifikasi ganda (push + WhatsApp) dalam satu platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin-login"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition"
              >
                Mulai dari Admin
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/drop"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-3 font-semibold text-white hover:border-emerald-400 transition"
              >
                Buka Drop Portal
              </Link>
            </div>
            <div className="flex gap-8 text-sm text-slate-300">
              <div>
                <p className="text-2xl font-bold text-white">2x</p>
                <p>Lebih cepat serah terima</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">-40%</p>
                <p>Keluhan paket hilang</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">+18%</p>
                <p>Retensi membership</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-emerald-500/10 blur-3xl" aria-hidden />
            <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Live Ops</span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">Online</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: <Box className="h-5 w-5 text-emerald-300" />,
                    title: "Drop-Off Portal",
                    desc: "Kurir scan + foto, paket otomatis tercatat.",
                    link: "/drop",
                  },
                  {
                    icon: <CreditCard className="h-5 w-5 text-amber-300" />,
                    title: "Midtrans Payment",
                    desc: "Snap token + webhook untuk paket & membership.",
                    link: "/admin-login",
                  },
                  {
                    icon: <Bell className="h-5 w-5 text-sky-300" />,
                    title: "Dual Notif",
                    desc: "Push & WhatsApp terkirim bersamaan.",
                    link: "/admin-login",
                  },
                  {
                    icon: <Smartphone className="h-5 w-5 text-rose-300" />,
                    title: "Kiosk POS",
                    desc: "Serah terima cepat dengan handover digital.",
                    link: "/kiosk",
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.link}
                    className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-800 p-2">{item.icon}</div>
                      <div className="space-y-1">
                        <p className="font-semibold text-white group-hover:text-emerald-200">{item.title}</p>
                        <p className="text-sm text-slate-300 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA strip */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/30 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-emerald-200">Pemasangan cepat</p>
            <p className="text-xl font-semibold text-white">Aktifkan dual notifikasi & pembayaran tanpa coding rumit.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin-login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100 transition"
            >
              Atur Notifikasi
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-400 px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:border-white transition"
            >
              Coba Sebagai Member
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
