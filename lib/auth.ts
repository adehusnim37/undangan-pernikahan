import crypto from "crypto";
import { cookies } from "next/headers";
import { getSessionSecret, useSecureCookies } from "@/lib/config";

const BASE_COOKIE_NAME = "undangan_admin";

/**
 * Prefix `__Host-` (hanya saat cookie Secure) mengikat cookie ke host dan
 * mencegah cookie dengan nama sama di-set dari subdomain lain.
 */
function cookieName() {
  return useSecureCookies() ? `__Host-${BASE_COOKIE_NAME}` : BASE_COOKIE_NAME;
}

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
  return isValidAdminSession((await cookies()).get(cookieName())?.value);
}

export const adminCookie = {
  name: cookieName(),
  options: { httpOnly: true, sameSite: "lax" as const, secure: useSecureCookies(), path: "/", maxAge: 60 * 60 * 12 },
};
