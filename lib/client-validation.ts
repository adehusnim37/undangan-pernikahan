import { z } from "zod";
import { toast } from "react-toastify";
import { GUEST_GROUPS, GUEST_TYPES } from "@/lib/guest-options";

const guestGroupSchema = z.union([
  z.enum(GUEST_GROUPS),
  z.literal(""),
]);
const guestTypeSchema = z.union([z.enum(GUEST_TYPES), z.literal("")]);

export const loginFormSchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

export const otpFormSchema = z.object({
  code: z.string().regex(/^\d{8}$/, "Masukkan 8 angka kode OTP."),
});

export const guestFormSchema = z.object({
  guestName: z.string().trim().min(1, "Nama tamu wajib diisi.").max(120, "Nama tamu maksimal 120 karakter."),
  guestType: guestTypeSchema,
  guestGroup: guestGroupSchema,
  maxGuests: z.number().int().min(1, "Kuota minimal 1 orang.").max(10, "Kuota maksimal 10 orang.").nullable(),
  maxDevices: z.number().int().min(1, "Minimal 1 perangkat.").max(100, "Maksimal 100 perangkat.").nullable(),
});

export const rsvpFormSchema = z.object({
  attendance: z.enum(["attending", "declined"]),
  guestCount: z.number().int().min(1, "Jumlah tamu minimal 1 orang."),
  message: z.string().trim().max(500, "Ucapan maksimal 500 karakter."),
  hash: z.string().regex(/^[a-f0-9]{32}$/, "Perangkat belum siap diverifikasi."),
});

/** Shows the first Zod issue as a Toast and returns parsed, typed data on success. */
export function validateWithToast<T extends z.ZodType>(schema: T, input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    toast.error(parsed.error.issues[0]?.message ?? "Data belum valid.");
    return null;
  }
  return parsed.data;
}
