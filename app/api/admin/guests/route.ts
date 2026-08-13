import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { newToken } from "@/lib/invitations";
import { createGuestBodySchema, parseJson, validationError } from "@/lib/validation";

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const result = await query(`
    SELECT i.id, i.token, i.guest_name, i.guest_group, i.max_guests, i.status, i.device_id,
      i.first_opened_at, i.created_at, r.attendance, r.guest_count, r.message, r.updated_at AS rsvp_updated_at
    FROM invitations i LEFT JOIN rsvps r ON r.invitation_id = i.id
    ORDER BY i.created_at DESC`);
  return NextResponse.json({ guests: result.rows });
}

export async function POST(request: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await parseJson(request, createGuestBodySchema);
  if (!body.success) return validationError(body.error);
  const { guestName, guestGroup, maxGuests } = body.data;
  const result = await query(
    "INSERT INTO invitations (token, guest_name, guest_group, max_guests) VALUES ($1, $2, $3, $4) RETURNING id, token, guest_name, guest_group, max_guests, status, created_at",
    [newToken(), guestName, guestGroup, maxGuests],
  );
  return NextResponse.json({ guest: result.rows[0] }, { status: 201 });
}
