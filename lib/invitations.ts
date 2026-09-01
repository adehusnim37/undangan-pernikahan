import { db, query } from "@/lib/db";
import crypto from "crypto";
import type { InvitationMediaDisplay, InvitationMediaFit, InvitationMediaSlot } from "@/lib/invitation-media";

export type Invitation = {
  id: string;
  token: string;
  guest_name: string;
  guest_type: string | null;
  guest_group: string | null;
  max_guests: number;
  max_devices: number;
  status: "active" | "revoked";
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
    "SELECT id, token, guest_name, guest_type, guest_group, max_guests, max_devices, status, first_opened_at, created_at FROM invitations WHERE token = $1",
    [token],
  );
  return result.rows[0] ?? null;
}

export async function claimInvitationDevice(invitationId: string, deviceId: string) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const invitation = await client.query<{ max_devices: number }>(
      "SELECT max_devices FROM invitations WHERE id = $1 FOR UPDATE",
      [invitationId],
    );

    if (invitation.rowCount !== 1) {
      await client.query("ROLLBACK");
      return false;
    }

    const existing = await client.query(
      "SELECT id FROM invitation_devices WHERE invitation_id = $1 AND device_id = $2",
      [invitationId, deviceId],
    );

    if (existing.rowCount === 1) {
      await client.query(
        "UPDATE invitation_devices SET last_opened_at = NOW() WHERE id = $1",
        [existing.rows[0].id],
      );
    } else {
      const deviceCount = await client.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM invitation_devices WHERE invitation_id = $1",
        [invitationId],
      );
      if (Number(deviceCount.rows[0]?.count ?? 0) >= invitation.rows[0].max_devices) {
        await client.query("COMMIT");
        return false;
      }
      await client.query(
        `INSERT INTO invitation_devices (invitation_id, device_id, first_opened_at, last_opened_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [invitationId, deviceId],
      );
    }

    await client.query(
      "UPDATE invitations SET first_opened_at = COALESCE(first_opened_at, NOW()), updated_at = NOW() WHERE id = $1",
      [invitationId],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function isInvitationDeviceAllowed(invitationId: string, deviceId: string) {
  const result = await query(
    "SELECT 1 FROM invitation_devices WHERE invitation_id = $1 AND device_id = $2",
    [invitationId, deviceId],
  );
  return result.rowCount === 1;
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
