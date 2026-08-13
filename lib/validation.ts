import { NextResponse } from "next/server";
import { z } from "zod";

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

export const createGuestBodySchema = guestFieldsSchema.strict();

export const updateGuestBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reset-device") }).strict(),
  z.object({ action: z.literal("toggle-status") }).strict(),
  z.object({ action: z.literal("delete") }).strict(),
  z.object({ action: z.literal("update-guest") }).extend(guestFieldsSchema.shape).strict(),
]);

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

export async function parseJson<T extends z.ZodType>(request: Request, schema: T) {
  const json: unknown = await request.json().catch(() => undefined);
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
