import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getInvitation, getrsvp } from "@/lib/invitations";
import { invitationAccessBodySchema, invitationParamsSchema, parseJson, validationError } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
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

  let allowed = invitation.device_id === hash;
  if (!invitation.device_id) {
    const claimed = await query<{ id: string }>(
      "UPDATE invitations SET device_id = $2,  first_opened_at = NOW(), updated_at = NOW() WHERE id = $1 AND device_id IS NULL RETURNING id",
      [invitation.id, hash],
    );
    allowed =
      claimed.rowCount === 1 ||
      (await getInvitation(token))?.device_id === hash;
  }
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
      : "Link ini sudah dibuka dari perangkat lain.",
  });
}
