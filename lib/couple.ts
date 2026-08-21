/**
 * Nama mempelai, diambil dari environment.
 *
 * Variabel `NEXT_PUBLIC_*` di-inline pada waktu build oleh Next.js, jadi akses
 * propertinya harus ditulis secara statis. Dynamic lookup seperti
 * `process.env[key]` tidak akan ikut masuk ke bundle client.
 */
function read(value: string | undefined, fallback: string): string {
  return (value ?? fallback).trim();
}

const bride = read(process.env.NEXT_PUBLIC_BRIDE_NAME, "Alvita");
const groom = read(process.env.NEXT_PUBLIC_GROOM_NAME, "Ade");

export const couple = {
  bride,
  groom,
  /** Gabungan untuk tampilan, mis. "Alvita & Ade". */
  name: read(process.env.NEXT_PUBLIC_COUPLE_NAME, `${bride} & ${groom}`),
};

/** Varian huruf besar untuk teks dekoratif/teknis. */
export const coupleCaps = {
  bride: couple.bride.toUpperCase(),
  groom: couple.groom.toUpperCase(),
  name: couple.name.toUpperCase(),
  /** Bentuk "ALVITA + ADE" untuk label kecil. */
  plus: `${couple.bride.toUpperCase()} + ${couple.groom.toUpperCase()}`,
};
