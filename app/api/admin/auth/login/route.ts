import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminCredentials, getSessionSecret } from "@/lib/config";
import {
  clientInfoFrom,
  getAdminRateLimit,
  recordAdminLogin,
  adminRateLimitConstants,
} from "@/lib/admin-security";
import {
  consumeOtpChallenge,
  createOtpChallenge,
  maskEmail,
  otpCookie,
} from "@/lib/admin-otp";
import { sendAdminOtp } from "@/lib/admin-mail";
import { assertSameOrigin } from "@/lib/csrf";
import {
  adminLoginBodySchema,
  parseJson,
  validationError,
} from "@/lib/validation";

function secureDigest(label: string, value: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(`${label}:${value}`)
    .digest();
}

function findCredential(email: string, password: string) {
  let matchedEmail: string | null = null;
  for (const credential of getAdminCredentials()) {
    const emailOk = crypto.timingSafeEqual(
      secureDigest("email", email.toLowerCase()),
      secureDigest("email", credential.email),
    );
    const passwordOk = crypto.timingSafeEqual(
      secureDigest("password", password),
      secureDigest("password", credential.password),
    );
    if (emailOk && passwordOk) matchedEmail = credential.email;
  }
  return matchedEmail;
}

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return json({ message: "Request tidak valid." }, { status: 403 });
  }

  const body = await parseJson(request, adminLoginBodySchema);
  if (!body.success) return validationError(body.error);
  const email = body.data.email.trim().toLowerCase();
  const { password } = body.data;
  const client = clientInfoFrom(request);

  const rateLimit = await getAdminRateLimit(email, client.ipAddress);
  if (rateLimit.locked) {
    const retryAfterSeconds = rateLimit.lockoutUntil
      ? Math.max(
          1,
          Math.ceil((new Date(rateLimit.lockoutUntil).getTime() - Date.now()) / 1000),
        )
      : adminRateLimitConstants.lockoutMs / 1000;
    const response = json(
      {
        message: "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
        retryAfterSeconds,
      },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(retryAfterSeconds));
    return response;
  }

  const matchedEmail = findCredential(email, password);
  if (!matchedEmail) {
    await recordAdminLogin(email, client.ipAddress, client.userAgent, false);
    return json(
      { message: "Email atau password tidak sesuai." },
      { status: 401 },
    );
  }

  const challenge = await createOtpChallenge(matchedEmail, client);
  if (!challenge.ok) {
    const response = json(
      {
        message: "Terlalu banyak permintaan kode. Coba lagi nanti.",
        retryAfterSeconds: challenge.retryAfterSeconds,
      },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(challenge.retryAfterSeconds));
    return response;
  }

  try {
    await sendAdminOtp(matchedEmail, challenge.code);
  } catch (error) {
    await consumeOtpChallenge(challenge.token).catch(() => undefined);
    console.error("Admin OTP delivery failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown SMTP error",
    });
    return json(
      { message: "Kode verifikasi belum dapat dikirim. Coba lagi nanti." },
      { status: 502 },
    );
  }

  const response = json({
    requiresOtp: true,
    destination: maskEmail(matchedEmail),
    expiresInSeconds: challenge.expiresInSeconds,
  });
  response.cookies.set(otpCookie.name, challenge.token, otpCookie.options);
  return response;
}
