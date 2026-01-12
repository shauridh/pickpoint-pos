"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GuardState = "checking" | "unauthorized" | "forbidden" | "authorized";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkAdminAccess() {
      try {
        const sessionRes = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          if (!cancelled) setState("unauthorized");
          router.replace("/login");
          return;
        }

        const sessionData = await sessionRes.json();
        const sessionUserId = sessionData?.userId ?? sessionData?.session?.userId;
        if (!sessionUserId) {
          if (!cancelled) setState("unauthorized");
          router.replace("/login");
          return;
        }

        const profileRes = await fetch("/api/profile", {
          cache: "no-store",
          credentials: "include",
        });

        if (!profileRes.ok) {
          if (!cancelled) setState("unauthorized");
          router.replace("/login");
          return;
        }

        const profileData = await profileRes.json();
        const role = profileData?.user?.role;

        if (role === "ADMIN" || role === "STAFF") {
          if (!cancelled) setState("authorized");
          return;
        }

        if (!cancelled) setState("forbidden");
        router.replace("/login");
      } catch (error) {
        console.error("Admin check error:", error);
        if (!cancelled) setState("unauthorized");
        router.replace("/login");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === "checking") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (state === "forbidden") {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Akses hanya untuk admin/staff.
      </div>
    );
  }

  if (state !== "authorized") {
    return null;
  }

  return <>{children}</>;
}
