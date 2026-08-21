import { NextResponse } from "next/server";
import { adminCookie } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ message: "Request tidak valid." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, "", { ...adminCookie.options, maxAge: 0 });
  return response;
}
