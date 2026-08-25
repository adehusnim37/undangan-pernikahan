import { getAllowedOrigin } from "@/lib/config";

/**
 * Validasi asal request mutasi admin (CSRF protection).
 * Non-GET requests dari origin berbeda (mis. situs jahat yang menyuruh browser
 * tamu mengirim request) ditolak sebelum mencapai handler.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Semua endpoint mutasi aplikasi dipanggil browser. Origin yang hilang tidak
  // diberi bypass; klien non-browser harus mengirim Origin yang diizinkan.
  if (!origin) return false;
  return origin.replace(/\/+$/, "") === getAllowedOrigin();
}

export function assertSameOrigin(request: Request): boolean {
  if (!isSameOrigin(request)) return false;
  return true;
}
