import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { query } from "@/lib/db";
import { newToken } from "@/lib/invitations";
import {
  createGuestBodySchema,
  parseJson,
  validationError,
} from "@/lib/validation";

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const result = await query(`
    SELECT i.id, i.token, i.guest_name, i.guest_type, i.guest_group, i.max_guests, i.max_devices, i.status,
      i.first_opened_at, i.created_at, COUNT(d.id)::int AS device_count,
      r.attendance, r.guest_count, r.message, r.updated_at AS rsvp_updated_at
    FROM invitations i
      LEFT JOIN invitation_devices d ON d.invitation_id = i.id
      LEFT JOIN rsvps r ON r.invitation_id = i.id
    GROUP BY i.id, r.attendance, r.guest_count, r.message, r.updated_at
    ORDER BY i.created_at DESC`);
  return NextResponse.json({ guests: result.rows });
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json(
      { message: "Request tidak valid." },
      { status: 403 },
    );
  }
  if (!(await isAdmin()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await parseJson(request, createGuestBodySchema);
  if (!body.success) return validationError(body.error);
  const { guestName, guestType, guestGroup, maxGuests, maxDevices } = body.data;
  const result = await query(
    "INSERT INTO invitations (token, guest_name, guest_type, guest_group, max_guests, max_devices) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, token, guest_name, guest_type, guest_group, max_guests, max_devices, status, created_at",
    [newToken(), guestName, guestType, guestGroup, maxGuests, maxDevices],
  );
  return NextResponse.json({ guest: result.rows[0] }, { status: 201 });
}
