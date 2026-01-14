import { SessionOptions } from "iron-session";

const rawPassword = process.env.SESSION_SECRET || "";
const fallbackPassword = "dev_fallback_session_secret_32_chars_min__";
const password = rawPassword.length >= 32 ? rawPassword : fallbackPassword;
const SESSION_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 year (persist until manual logout)

if (rawPassword.length < 32) {
  console.warn(
    "SESSION_SECRET is missing or shorter than 32 characters; using dev fallback. Update .env.local to avoid this in production."
  );
}

export const sessionOptions: SessionOptions = {
  cookieName: "pickpoint_session",
  password,
  ttl: SESSION_TTL_SECONDS,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
  },
};

export interface SessionData {
  userId?: string;
  phone?: string;
  name?: string;
  isLoggedIn?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      session: SessionData;
    }
  }
}
