import { type NextRequest, NextResponse } from "next/server";
import { adminCookie, createAdminSession } from "@/lib/auth";
import { clientInfoFrom, recordAdminLogin } from "@/lib/admin-security";
import { otpCookie, verifyOtp } from "@/lib/admin-otp";
import { assertSameOrigin } from "@/lib/csrf";
import { adminOtpBodySchema, parseJson, validationError } from "@/lib/validation";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return json({ message: "Request tidak valid." }, { status: 403 });
  }
  const body = await parseJson(request, adminOtpBodySchema);
  if (!body.success) return validationError(body.error);
  const challengeToken = request.cookies.get(otpCookie.name)?.value;
  if (!challengeToken) {
    return json(
      { message: "Sesi verifikasi tidak valid. Silakan login ulang." },
      { status: 401 },
    );
  }

  const verification = await verifyOtp(
    challengeToken,
    body.data.code,
  );
  if (!verification.ok) {
    const message =
      verification.reason === "incorrect"
        ? `Kode tidak sesuai. Tersisa ${verification.attemptsRemaining} percobaan.`
        : verification.reason === "expired"
          ? "Kode sudah kedaluwarsa. Silakan login ulang."
          : "Sesi verifikasi tidak valid. Silakan login ulang.";
    const response = json(
      {
        message,
        attemptsRemaining:
          "attemptsRemaining" in verification
            ? verification.attemptsRemaining
            : 0,
      },
      { status: verification.reason === "incorrect" ? 401 : 410 },
    );
    if (verification.reason !== "incorrect") {
      response.cookies.set(otpCookie.name, "", {
        ...otpCookie.options,
        maxAge: 0,
      });
    }
    return response;
  }

  const client = clientInfoFrom(request);
  const sessionToken = await createAdminSession(verification.email, client);
  await recordAdminLogin(
    verification.email,
    client.ipAddress,
    client.userAgent,
    true,
  );
  const response = json({ ok: true });
  response.cookies.set(adminCookie.name, sessionToken, adminCookie.options);
  response.cookies.set(otpCookie.name, "", { ...otpCookie.options, maxAge: 0 });
  return response;
}
