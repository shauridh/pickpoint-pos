import { cookies } from "next/headers";

const SESSION_COOKIE = "pickpoint_session";

export interface SessionData {
  userId?: string;
  phone?: string;
  name?: string;
  isLoggedIn?: boolean;
}

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return {};
  }

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return {};
  }
}

export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
