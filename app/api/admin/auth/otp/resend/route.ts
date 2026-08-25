import { type NextRequest, NextResponse } from "next/server";
import { sendAdminOtp } from "@/lib/admin-mail";
import { consumeOtpChallenge, otpCookie, resendOtp } from "@/lib/admin-otp";
import { assertSameOrigin } from "@/lib/csrf";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return json({ message: "Request tidak valid." }, { status: 403 });
  }
  const token = request.cookies.get(otpCookie.name)?.value;
  if (!token) {
    return json(
      { message: "Sesi verifikasi tidak valid. Silakan login ulang." },
      { status: 401 },
    );
  }
  const result = await resendOtp(token);
  if (!result.ok) {
    if (result.reason === "cooldown") {
      const response = json(
        {
          message: `Tunggu ${result.retryAfterSeconds} detik sebelum meminta kode baru.`,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: 429 },
      );
      response.headers.set("Retry-After", String(result.retryAfterSeconds));
      return response;
    }
    return json(
      {
        message:
          result.reason === "limit"
            ? "Batas pengiriman kode tercapai. Silakan login ulang nanti."
            : "Sesi verifikasi tidak valid. Silakan login ulang.",
      },
      { status: result.reason === "limit" ? 429 : 401 },
    );
  }

  try {
    await sendAdminOtp(result.email, result.code);
  } catch (error) {
    await consumeOtpChallenge(token).catch(() => undefined);
    console.error("Admin OTP resend failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown SMTP error",
    });
    return json(
      { message: "Kode verifikasi belum dapat dikirim. Silakan login ulang." },
      { status: 502 },
    );
  }

  const response = json({ ok: true, expiresInSeconds: result.expiresInSeconds });
  response.cookies.set(otpCookie.name, token, otpCookie.options);
  return response;
}
