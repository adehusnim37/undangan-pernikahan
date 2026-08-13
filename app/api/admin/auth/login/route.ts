import crypto from "crypto";
import { NextResponse } from "next/server";
import { adminCookie, createAdminSession } from "@/lib/auth";
import { adminLoginBodySchema, parseJson, validationError } from "@/lib/validation";

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const body = await parseJson(request, adminLoginBodySchema);
  if (!body.success) return validationError(body.error);
  const { email, password } = body.data;
  if (!same(email, process.env.ADMIN_EMAIL ?? "admin@undangan.local") || !same(password, process.env.ADMIN_PASSWORD ?? "ganti-password-ini")) {
    return NextResponse.json({ message: "Email atau password tidak sesuai." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, createAdminSession(), adminCookie.options);
  return response;
}
