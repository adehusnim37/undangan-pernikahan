import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { claimInvitationDevice, getInvitation, getrsvp } from "@/lib/invitations";
import { assertSameOrigin } from "@/lib/csrf";
import { clientInfoFrom } from "@/lib/admin-security";
import { consumeRateLimit } from "@/lib/rate-limit";
import { invitationAccessBodySchema, invitationParamsSchema, parseJson, validationError } from "@/lib/validation";

const ACCESS_LIMIT_PER_IP = 30; // klaim/verifikasi per IP
const ACCESS_WINDOW_SECONDS = 600; // dalam 10 menit

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ message: "Request tidak valid." }, { status: 403 });
  }
  const { ipAddress } = clientInfoFrom(request);
  if (!(await consumeRateLimit("invite-access", ipAddress, ACCESS_LIMIT_PER_IP, ACCESS_WINDOW_SECONDS))) {
    return NextResponse.json(
      { message: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429 },
    );
  }
  const rawParams = await params;
  const parsedParams = invitationParamsSchema.safeParse(rawParams);
  if (!parsedParams.success) return validationError(parsedParams.error);
  const body = await parseJson(request, invitationAccessBodySchema);
  if (!body.success) return validationError(body.error);
  const { token } = parsedParams.data;
  const { hash } = body.data;
  const invitation = await getInvitation(token);
  if (!invitation || invitation.status !== "active")
    return NextResponse.json(
      { allowed: false, message: "Undangan tidak tersedia." },
      { status: 404 },
    );

  const allowed = await claimInvitationDevice(invitation.id, hash);
  await query(
    "INSERT INTO access_logs (invitation_id, device_id, allowed, reason) VALUES ($1, $2, $3, $4)",
    [
      invitation.id,
      hash,
      allowed,
      allowed ? "device-matched" : "device-mismatch",
    ],
  );
  return NextResponse.json({
    allowed,
    rsvp: allowed ? await getrsvp(invitation.id) : null,
    message: allowed
      ? "Undangan telah diverifikasi."
      : invitation.max_devices !== null
        ? `Batas ${invitation.max_devices} perangkat untuk link ini sudah tercapai.`
        : "Batas perangkat untuk link ini sudah tercapai.",
  });
}
