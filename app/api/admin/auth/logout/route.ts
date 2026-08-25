import { type NextRequest, NextResponse } from "next/server";
import { adminCookie, revokeAdminSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json(
      { message: "Request tidak valid." },
      { status: 403 },
    );
  }
  const sessionToken = request.cookies.get(adminCookie.name)?.value;
  if (sessionToken) {
    await revokeAdminSession(sessionToken);
  }
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(adminCookie.name, "", {
    ...adminCookie.options,
    maxAge: 0,
  });
  return response;
}
