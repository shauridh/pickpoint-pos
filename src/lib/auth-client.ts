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
    const response = await fetch("/api/auth/session");
    if (!response.ok) return {};
    return await response.json();
  } catch (error) {
    console.error("Fetch session error:", error);
    return {};
  }
}
