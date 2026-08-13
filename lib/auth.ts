import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "undangan_admin";

function secret() {
  return process.env.SESSION_SECRET || "local-development-secret-change-me";
}

function signature(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function createAdminSession() {
  const expires = String(Date.now() + 1000 * 60 * 60 * 12);
  return `${expires}.${signature(expires)}`;
}

export function isValidAdminSession(value?: string) {
  if (!value) return false;
  const [expires, signed] = value.split(".");
  if (!expires || !signed || Number(expires) < Date.now()) return false;
  const expected = signature(expires);
  return signed.length === expected.length && crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(expected));
}

export async function isAdmin() {
  return isValidAdminSession((await cookies()).get(COOKIE_NAME)?.value);
}

export const adminCookie = {
  name: COOKIE_NAME,
  options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 },
};
