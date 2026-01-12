import { SessionOptions } from "iron-session";

const rawPassword = process.env.SESSION_SECRET || "";
const fallbackPassword = "dev_fallback_session_secret_32_chars_min__";
const password = rawPassword.length >= 32 ? rawPassword : fallbackPassword;

if (rawPassword.length < 32) {
  console.warn(
    "SESSION_SECRET is missing or shorter than 32 characters; using dev fallback. Update .env.local to avoid this in production."
  );
}

export const sessionOptions: SessionOptions = {
  cookieName: "pickpoint_session",
  password,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
