import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drop-Off - PickPoint",
  description: "Portal drop-off paket untuk kurir",
};

export default function DropLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {children}
    </div>
  );
}
