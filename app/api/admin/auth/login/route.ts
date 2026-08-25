import crypto from "crypto";
import { NextResponse } from "next/server";
import { adminCookie, createAdminSession } from "@/lib/auth";
import { getAdminCredentials } from "@/lib/config";
import {
  clientInfoFrom,
  getAdminRateLimit,
  recordAdminLogin,
  adminRateLimitConstants,
} from "@/lib/admin-security";
import { assertSameOrigin } from "@/lib/csrf";
import {
  adminLoginBodySchema,
  parseJson,
  validationError,
} from "@/lib/validation";

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function unauthorized(message = "Email atau password tidak sesuai.") {
  return NextResponse.json({ message }, { status: 401 });
}

export async function POST(request: Request) {
  // CSRF: hanya izinkan request dari origin aplikasi sendiri.
  if (!assertSameOrigin(request)) {
    return NextResponse.json(
      { message: "Request tidak valid." },
      { status: 403 },
    );
  }

  const body = await parseJson(request, adminLoginBodySchema);
  if (!body.success) return validationError(body.error);
  const { email, password } = body.data;
  const { ipAddress, userAgent } = clientInfoFrom(request);

  const rateLimit = await getAdminRateLimit(email, ipAddress);
  if (rateLimit.locked) {
    await recordAdminLogin(email, ipAddress, userAgent, false);
    return NextResponse.json(
      {
        message: `Terlalu banyak percobaan. Coba lagi setelah ${Math.ceil(adminRateLimitConstants.lockoutMs / 60000)} menit.`,
        retryAfterSeconds: adminRateLimitConstants.lockoutMs / 1000,
      },
      { status: 429 },
    );
  }

  const { email: adminEmail, password: adminPassword } = getAdminCredentials();
  // Bandingkan keduanya tanpa short-circuit agar tidak bocor validitas email
  // lewat perbedaan waktu respons.
  const emailOk = same(email, adminEmail);
  const passwordOk = same(password, adminPassword);
  const valid = emailOk && passwordOk;
  await recordAdminLogin(email, ipAddress, userAgent, valid);
  if (!valid) return unauthorized();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    adminCookie.name,
    createAdminSession(),
    adminCookie.options,
  );
  return response;
}
