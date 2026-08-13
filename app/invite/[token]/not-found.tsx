import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">UNDANGAN TIDAK TERSEDIA</p>
      <h1>Link ini tidak dapat dibuka.</h1>
      <p>Mungkin tautannya keliru, sudah dicabut, atau aksesnya ditutup.</p>
      <Link className="button button-solid" href="/">
        Kembali
      </Link>
    </main>
  );
}
