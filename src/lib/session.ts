import { IronSessionOptions } from "iron-session";

export const sessionOptions: IronSessionOptions = {
  cookieName: "pickpoint_session",
  password: process.env.SESSION_SECRET!,
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
