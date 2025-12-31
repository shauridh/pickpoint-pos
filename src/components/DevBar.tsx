"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Package, MonitorPlay } from "lucide-react";
import { useState } from "react";

const devLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
  { href: "/drop", label: "Drop", icon: Package },
  { href: "/kiosk", label: "Kiosk", icon: MonitorPlay },
];

export default function DevBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Always show in development
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-[100] w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition flex items-center justify-center"
        title="Dev Navigation"
      >
        <span className="text-xl">🔧</span>
      </button>

      {/* Dev Bar */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-[100] bg-slate-900 text-white rounded-xl shadow-2xl p-3 border border-slate-700">
          <div className="text-[10px] text-slate-500 mb-2 px-2 uppercase tracking-wider">
            Dev Nav
          </div>
          <div className="space-y-1">
            {devLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || 
                (link.href !== "/" && pathname.startsWith(link.href));
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
