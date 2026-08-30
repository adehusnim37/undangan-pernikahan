import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { query } from "@/lib/db";
import {
  parseJson,
  resetDeviceBulkBodySchema,
  validationError,
} from "@/lib/validation";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json(
      { message: "Request tidak valid." },
      { status: 403 },
    );
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJson(request, resetDeviceBulkBodySchema);
  if (!body.success) return validationError(body.error);

  const result = await query(
    `UPDATE invitations
     SET device_id = NULL, first_opened_at = NULL, updated_at = NOW()
     WHERE id = ANY($1::uuid[])
     RETURNING id`,
    [body.data.ids],
  );

  return NextResponse.json({
    ok: true,
    resetCount: result.rowCount ?? result.rows.length,
  });
}
