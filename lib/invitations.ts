import { query } from "@/lib/db";
import crypto from "crypto";

export type Invitation = {
  id: string;
  token: string;
  guest_name: string;
  guest_group: string | null;
  max_guests: number;
  status: "active" | "revoked";
  device_id: string | null;
  first_opened_at: string | null;
  created_at: string;
};

export async function getInvitation(token: string) {
  const result = await query<Invitation>(
    "SELECT id, token, guest_name, guest_group, max_guests, status, device_id, first_opened_at, created_at FROM invitations WHERE token = $1",
    [token],
  );
  return result.rows[0] ?? null;
}

export async function getrsvp(invitationId: string) {
  const result = await query(
    "SELECT attendance, guest_count, message, updated_at, current_editable_rsvps, max_editable_rsvps FROM rsvps WHERE invitation_id = $1",
    [invitationId],
  );
  return result.rows[0] ?? null;
}

export function newToken() {
  const inviteToken = crypto.randomBytes(24).toString('base64url');
  return inviteToken;
}
