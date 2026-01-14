// Client-side session helper - untuk fetch session via API
// Tidak menggunakan next/headers

export interface SessionData {
  userId?: string;
  phone?: string;
  name?: string;
  isLoggedIn?: boolean;
}

export async function getSessionFromClient(): Promise<SessionData> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    if (response.status === 401) {
      return {};
    }

    if (!response.ok) {
      console.error("Session fetch failed", response.status, await response.text().catch(() => ""));
      return {};
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch session error:", error);
    return {};
  }
}
