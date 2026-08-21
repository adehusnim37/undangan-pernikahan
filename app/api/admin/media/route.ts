import crypto from "crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { query } from "@/lib/db";
import type { InvitationMedia } from "@/lib/invitations";
import { deleteImage, putImage } from "@/lib/r2";
import {
  imageContentTypeSchema,
  imageDisplaySettingsSchema,
  imageUploadMetadataSchema,
  parseJson,
  validationError,
} from "@/lib/validation";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" } as const;

function hasBytes(bytes: Uint8Array, signature: readonly number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function hasValidSignature(bytes: Uint8Array, contentType: keyof typeof extensions) {
  if (contentType === "image/jpeg") return hasBytes(bytes, [0xff, 0xd8, 0xff]);
  if (contentType === "image/png") return hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (contentType === "image/gif") return hasBytes(bytes, [0x47, 0x49, 0x46, 0x38]);
  return hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) && hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8);
}

function sanitizeOriginalName(name: string) {
  const safe = name.normalize("NFKC").replace(/[^a-zA-Z0-9._ -]/g, "_").replace(/\s+/g, " ").trim();
  return (safe || "image").slice(0, 160);
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const result = await query<InvitationMedia>(
    "SELECT slot, public_url, original_name, content_type, byte_size, object_fit, scale, position_x, position_y, updated_at FROM invitation_media ORDER BY slot ASC",
  );
  return NextResponse.json({ media: result.rows });
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ message: "Request tidak valid." }, { status: 403 });
  }
  if (!(await isAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ message: "Form upload tidak valid." }, { status: 400 });

  const metadata = imageUploadMetadataSchema.safeParse({ slot: formData.get("slot") });
  if (!metadata.success) return validationError(metadata.error);

  const entry = formData.get("file");
  if (!(entry instanceof File)) return NextResponse.json({ message: "File gambar wajib dipilih." }, { status: 400 });
  if (entry.size < 1 || entry.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ message: "Ukuran gambar maksimal 8 MB." }, { status: 400 });
  }

  const parsedType = imageContentTypeSchema.safeParse(entry.type);
  if (!parsedType.success) return validationError(parsedType.error);
  const contentType = parsedType.data;
  const bytes = new Uint8Array(await entry.arrayBuffer());
  if (!hasValidSignature(bytes, contentType)) {
    return NextResponse.json({ message: "Isi file tidak cocok dengan tipe gambar." }, { status: 400 });
  }

  const { slot } = metadata.data;
  const previous = await query<{ object_key: string }>("SELECT object_key FROM invitation_media WHERE slot = $1", [slot]);
  const objectKey = `invitation-media/${slot}/${crypto.randomUUID()}.${extensions[contentType]}`;

  try {
    const publicUrl = await putImage({ key: objectKey, body: bytes, contentType, contentLength: entry.size });
    try {
      const result = await query<InvitationMedia>(
        `INSERT INTO invitation_media (slot, object_key, public_url, original_name, content_type, byte_size)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slot) DO UPDATE SET
           object_key = EXCLUDED.object_key,
           public_url = EXCLUDED.public_url,
           original_name = EXCLUDED.original_name,
           content_type = EXCLUDED.content_type,
           byte_size = EXCLUDED.byte_size,
           updated_at = NOW()
         RETURNING slot, public_url, original_name, content_type, byte_size, object_fit, scale, position_x, position_y, updated_at`,
        [slot, objectKey, publicUrl, sanitizeOriginalName(entry.name), contentType, entry.size],
      );
      const oldKey = previous.rows[0]?.object_key;
      if (oldKey && oldKey !== objectKey) {
        await deleteImage(oldKey).catch((cleanupError) => console.error("Old R2 image cleanup failed", cleanupError));
      }
      return NextResponse.json({ media: result.rows[0] }, { status: 201 });
    } catch (databaseError) {
      await deleteImage(objectKey).catch((cleanupError) => console.error("R2 cleanup failed", cleanupError));
      throw databaseError;
    }
  } catch (error) {
    console.error("Invitation media upload failed", error);
    return NextResponse.json({ message: "Gambar belum dapat disimpan. Periksa konfigurasi R2 dan database." }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ message: "Request tidak valid." }, { status: 403 });
  }
  if (!(await isAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await parseJson(request, imageDisplaySettingsSchema);
  if (!body.success) return validationError(body.error);

  const result = await query<InvitationMedia>(
    `UPDATE invitation_media
     SET object_fit = $2, scale = $3, position_x = $4, position_y = $5, updated_at = NOW()
     WHERE slot = $1
     RETURNING slot, public_url, original_name, content_type, byte_size, object_fit, scale, position_x, position_y, updated_at`,
    [body.data.slot, body.data.fit, body.data.scale, body.data.positionX, body.data.positionY],
  );
  if (!result.rows[0]) {
    return NextResponse.json({ message: "Upload foto pada slot ini sebelum mengatur tampilannya." }, { status: 404 });
  }
  return NextResponse.json({ media: result.rows[0] });
}
