/**
 * Nama mempelai, diambil dari environment.
 *
 * Variabel `NEXT_PUBLIC_*` di-inline pada waktu build oleh Next.js, jadi aman
 * dipakai dari server component maupun client component. Nilai fallback
 * dipakai bila env belum diisi (untuk development).
 */
function read(key: string, fallback: string): string {
  return (process.env[key] ?? fallback).trim();
}

export const couple = {
  bride: read("NEXT_PUBLIC_BRIDE_NAME", "Alvita"),
  groom: read("NEXT_PUBLIC_GROOM_NAME", "Ade"),
  /** Gabungan untuk tampilan, mis. "Alvita & Ade". */
  name: read("NEXT_PUBLIC_COUPLE_NAME", "Alvita & Ade"),
};

/** Varian huruf besar untuk teks dekoratif/teknis. */
export const coupleCaps = {
  bride: couple.bride.toUpperCase(),
  groom: couple.groom.toUpperCase(),
  name: couple.name.toUpperCase(),
  /** Bentuk "ALVITA + ADE" untuk label kecil. */
  plus: `${couple.bride.toUpperCase()} + ${couple.groom.toUpperCase()}`,
};
