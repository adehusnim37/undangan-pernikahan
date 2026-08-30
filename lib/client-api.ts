import { z } from "zod";

const apiErrorSchema = z.object({ message: z.string().min(1) }).loose();

/** Extract a safe, user-facing message from any API failure response. */
export async function getApiErrorMessage(
  response: Response,
  fallback = "Request gagal diproses. Coba lagi.",
) {
  const payload: unknown = await response.json().catch(() => undefined);
  const parsed = apiErrorSchema.safeParse(payload);
  return parsed.success ? parsed.data.message : fallback;
}

/**
 * Buka WhatsApp dengan pesan undangan terisi (share sheet), lalu pengguna
 * memilih kontak tujuannya sendiri. Dipakai tombol "Kirim ke WA" di daftar
 * tamu. Memakai `wa.me/?text=...` (tanpa nomor) agar di mobile langsung
 * membuka aplikasi WhatsApp dan memilih kontak — bukan blast ke nomor tetap.
 */
export function openWhatsAppInvite(guest: { guest_name: string; token: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (!appUrl) return { ok: false as const, message: "NEXT_PUBLIC_APP_URL belum diatur." };

  const text = [
    "Kepada Yth.",
    `Bapak/Ibu/Saudara/i *${guest.guest_name}*`,
    "",
    "*Assalamualaikum Warahmatullahi Wabarakatuh*",
    "",
    "Dengan mengharap ridha dan rahmat Allah SWT, kami mengundang Bpk/Ibu/Sdr/i untuk hadir di acara pernikahan kami:",
    "*Alvita Raniah Aisyah Putri & Ade Husni Mubarrok*",
    "",
    "Untuk informasi detail acara dan tempat, silahkan mengakses tautan berikut ini:",
    `*${appUrl}/invite/${guest.token}*`,
    "",
    "Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i dapat ikut hadir membersamai hari bahagia ini.",
    "*Wassalamualaikum Warahmatullahi Wabarakatuh*",
    "",
    "Kami yang berbahagia,",
    "Alvita & Ade",
  ].join("\n");

  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
  return { ok: true as const };
}
