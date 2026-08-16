import { query } from "@/lib/db";
import crypto from "crypto";
import type { InvitationMediaDisplay, InvitationMediaFit, InvitationMediaSlot } from "@/lib/invitation-media";

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
  media?: Partial<Record<InvitationMediaSlot, InvitationMediaDisplay>>;
};

export type InvitationMedia = {
  slot: InvitationMediaSlot;
  public_url: string;
  original_name: string;
  content_type: string;
  byte_size: number;
  object_fit: InvitationMediaFit;
  scale: number;
  position_x: number;
  position_y: number;
  updated_at: string;
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

export async function getInvitationMedia() {
  const result = await query<InvitationMedia>(
    "SELECT slot, public_url, original_name, content_type, byte_size, object_fit, scale, position_x, position_y, updated_at FROM invitation_media ORDER BY slot ASC",
  );
  return Object.fromEntries(result.rows.map((item) => [item.slot, {
    url: item.public_url,
    fit: item.object_fit,
    scale: item.scale,
    positionX: item.position_x,
    positionY: item.position_y,
  }])) as Partial<
    Record<InvitationMediaSlot, InvitationMediaDisplay>
  >;
}

export function newToken() {
  const inviteToken = crypto.randomBytes(24).toString('base64url');
  return inviteToken;
}
