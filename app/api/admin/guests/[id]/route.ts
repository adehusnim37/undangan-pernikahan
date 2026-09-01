import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { query } from "@/lib/db";
import {
  guestIdParamsSchema,
  parseJson,
  updateGuestBodySchema,
  validationError,
} from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json(
      { message: "Request tidak valid." },
      { status: 403 },
    );
  }
  if (!(await isAdmin()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsedParams = guestIdParamsSchema.safeParse(await params);
  if (!parsedParams.success) return validationError(parsedParams.error);
  const { id } = parsedParams.data;
  const body = await parseJson(request, updateGuestBodySchema);
  if (!body.success) return validationError(body.error);
  const action = body.data.action;
  if (action === "reset-device") {
    await query(
      "DELETE FROM invitation_devices WHERE invitation_id = $1",
      [id],
    );
    await query(
      "UPDATE invitations SET device_id = NULL, first_opened_at = NULL, updated_at = NOW() WHERE id = $1",
      [id],
    );
  } else if (action === "toggle-status") {
    await query(
      "UPDATE invitations SET status = CASE WHEN status = 'active' THEN 'revoked' ELSE 'active' END, updated_at = NOW() WHERE id = $1",
      [id],
    );
  } else if (action === "update-guest") {
    const { guestName, guestType, guestGroup, maxGuests, maxDevices } = body.data;
    await query(
      "UPDATE invitations SET guest_name = $2, guest_type = $3, guest_group = $4, max_guests = $5, max_devices = $6, updated_at = NOW() WHERE id = $1",
      [id, guestName, guestType, guestGroup, maxGuests, maxDevices],
    );
    // Setelah data tamu diubah, beri kesempatan edit ulang dengan mereset
    // penghitung perubahan RSVP (kolom ini ada di tabel rsvps, bukan invitations).
    await query(
      "UPDATE rsvps SET current_editable_rsvps = 1, updated_at = NOW() WHERE invitation_id = $1",
      [id],
    );
  } else if (action === "delete") {
    const checkRsvp = await query(
      "SELECT id FROM rsvps WHERE invitation_id = $1",
      [id],
    );
    if ((checkRsvp?.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { message: "Tamu ini sudah mengirim konfirmasi, tidak bisa dihapus." },
        { status: 400 },
      );
    }
    await query("DELETE FROM invitations WHERE id = $1", [id]);
  } else {
    return NextResponse.json(
      { message: "Aksi tidak dikenal." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
