import { NextResponse } from "next/server";
import { z } from "zod";
import { invitationMediaSlotValues } from "@/lib/invitation-media";

// Tokens are generated with crypto.randomBytes(24).toString("base64url").
// Accept legacy tokens too, while keeping the URL segment to safe base64url chars.
const invitationToken = /^[A-Za-z0-9_-]{18,128}$/;
const thumbmark = /^[a-f0-9]{32}$/;

export const invitationParamsSchema = z
  .object({ token: z.string().regex(invitationToken, "Token undangan tidak valid.") })
  .strict();

export const guestIdParamsSchema = z
  .object({ id: z.string().uuid("ID tamu tidak valid.") })
  .strict();

const guestGroupSchema = z
  .union([z.enum(["keluarga", "kantor", "kerabat"]), z.literal("")])
  .transform((value) => value || null);

const guestFieldsSchema = z.object({
  guestName: z.string().trim().min(1, "Nama tamu wajib diisi.").max(120, "Nama tamu maksimal 120 karakter."),
  guestGroup: guestGroupSchema,
  maxGuests: z.number().int().min(1, "Kuota minimal 1 orang.").max(10, "Kuota maksimal 10 orang."),
});

export const adminLoginBodySchema = z
  .object({
    email: z.email("Email tidak valid.").max(254),
    password: z.string().min(1, "Password wajib diisi.").max(1024),
  })
  .strict();

export const adminOtpBodySchema = z
  .object({
    code: z.string().regex(/^\d{8}$/, "Kode OTP harus terdiri dari 8 angka."),
  })
  .strict();

export const createGuestBodySchema = guestFieldsSchema.strict();

export const updateGuestBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reset-device") }).strict(),
  z.object({ action: z.literal("toggle-status") }).strict(),
  z.object({ action: z.literal("delete") }).strict(),
  z.object({ action: z.literal("update-guest") }).extend(guestFieldsSchema.shape).strict(),
]);

export const resetDeviceBulkBodySchema = z
  .object({
    ids: z
      .array(z.string().uuid("ID tamu tidak valid."))
      .min(1, "Pilih minimal satu undangan.")
      .max(5000, "Maksimal 5000 undangan per permintaan.")
      .refine((ids) => new Set(ids).size === ids.length, "ID undangan tidak boleh duplikat."),
  })
  .strict();

export const invitationAccessBodySchema = z
  .object({
    hash: z.string().regex(thumbmark, "Fingerprint perangkat tidak valid."),
    metadata: z.object({ source: z.literal("thumbmarkjs") }).strict(),
  })
  .strict();

export const rsvpBodySchema = z
  .object({
    attendance: z.enum(["attending", "declined"]),
    guestCount: z.number().int().min(1),
    message: z.string().trim().max(500, "Ucapan maksimal 500 karakter."),
    hash: z.string().regex(thumbmark, "Fingerprint perangkat tidak valid."),
  })
  .strict();

export const invitationMediaSlotSchema = z.enum(invitationMediaSlotValues);
export const imageUploadMetadataSchema = z.object({ slot: invitationMediaSlotSchema }).strict();
export const imageContentTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const imageDisplaySettingsSchema = z
  .object({
    slot: invitationMediaSlotSchema,
    fit: z.enum(["cover", "contain"]),
    scale: z.number().finite().min(0.5).max(2.5).transform((value) => Math.round(value * 20) / 20),
    positionX: z.number().finite().min(0).max(100).transform((value) => Math.round(value * 10) / 10),
    positionY: z.number().finite().min(0).max(100).transform((value) => Math.round(value * 10) / 10),
  })
  .strict();

const MAX_BODY_BYTES = 128 * 1024; // 128 KB cukup untuk semua payload aplikasi ini.

export async function parseJson<T extends z.ZodType>(request: Request, schema: T) {
  const text = await request.text().catch(() => undefined);
  if (text === undefined || text.length > MAX_BODY_BYTES) return schema.safeParse(undefined);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return schema.safeParse(json);
}

export function validationError(error: z.ZodError) {
  const firstIssue = error.issues[0];
  return NextResponse.json(
    {
      message: firstIssue?.message ?? "Request tidak valid.",
      issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    },
    { status: 400 },
  );
}
