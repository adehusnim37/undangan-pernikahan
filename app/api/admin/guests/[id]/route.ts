import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (action === "reset-device") {
    await query(
      "UPDATE invitations SET device_hash = NULL, device_metadata = NULL, first_opened_at = NULL, updated_at = NOW() WHERE id = $1",
      [id],
    );
  } else if (action === "toggle-status") {
    await query(
      "UPDATE invitations SET status = CASE WHEN status = 'active' THEN 'revoked' ELSE 'active' END, updated_at = NOW() WHERE id = $1",
      [id],
    );
  } else if (action === "update-guest") {
    const guestName = String(body?.guestName ?? "").trim();
    const guestGroup = String(body?.guestGroup ?? "").trim() || null;
    const maxGuests = Number(body?.maxGuests ?? 1);
    if (
      !guestName ||
      !Number.isInteger(maxGuests) ||
      maxGuests < 1 ||
      maxGuests > 5
    ) {
      return NextResponse.json(
        { message: "Nama tamu dan kuota 1-5 wajib valid." },
        { status: 400 },
      );
    }
    await query(
      "UPDATE invitations SET guest_name = $2, guest_group = $3, max_guests = $4, current_editable_rsvps = LEAST(current_editable_rsvps + 1, max_editable_rsvps), updated_at = NOW() WHERE id = $1",
      [id, guestName, guestGroup, maxGuests],
    );
  } else if (action === "delete") {
    const checkRsvp = await query("SELECT id FROM rsvps WHERE invitation_id = $1", [id]);
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
