import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getInvitation } from "@/lib/invitations";
import { invitationParamsSchema, parseJson, rsvpBodySchema, validationError } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const rawParams = await params;
  const parsedParams = invitationParamsSchema.safeParse(rawParams);
  if (!parsedParams.success) return validationError(parsedParams.error);
  const body = await parseJson(request, rsvpBodySchema);
  if (!body.success) return validationError(body.error);
  const { token } = parsedParams.data;
  const invitation = await getInvitation(token);
  const { attendance, guestCount, message, hash } = body.data;

  if (
    !invitation ||
    invitation.status !== "active" ||
    invitation.device_id !== hash
  )
    return NextResponse.json(
      { message: "Akses perlu diverifikasi ulang." },
      { status: 403 },
    );

  if (guestCount > invitation.max_guests) {
    return NextResponse.json(
      { message: "Data konfirmasi tidak valid." },
      { status: 400 },
    );
  }

  const existing = await query<{ current_editable_rsvps: number; max_editable_rsvps: number }>(
    "SELECT current_editable_rsvps, max_editable_rsvps FROM rsvps WHERE invitation_id = $1",
    [invitation.id],
  );
  if (
    existing.rowCount === 1 &&
    existing.rows[0].current_editable_rsvps >= existing.rows[0].max_editable_rsvps
  ) {
    return NextResponse.json(
      { message: "Batas perubahan konfirmasi sudah tercapai." },
      { status: 403 },
    );
  }

  await query(
    `INSERT INTO rsvps (invitation_id, attendance, guest_count, current_editable_rsvps, max_editable_rsvps, message)
     VALUES ($1, $2, $3, 1, 2, $4)
     ON CONFLICT (invitation_id) DO UPDATE SET
       attendance = EXCLUDED.attendance,
       guest_count = EXCLUDED.guest_count,
       current_editable_rsvps = rsvps.current_editable_rsvps + 1,
       message = EXCLUDED.message,
       updated_at = NOW()`,
    [invitation.id, attendance, guestCount, message || null],
  );
  return NextResponse.json({ ok: true });
}
