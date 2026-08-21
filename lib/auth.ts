import crypto from "crypto";
import { cookies } from "next/headers";
import { getSessionSecret, useSecureCookies } from "@/lib/config";

const COOKIE_NAME = "undangan_admin";

function secret() {
  return getSessionSecret();
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
  options: { httpOnly: true, sameSite: "lax" as const, secure: useSecureCookies(), path: "/", maxAge: 60 * 60 * 12 },
};
