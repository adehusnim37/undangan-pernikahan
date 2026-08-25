import Link from "next/link";
import { couple } from "@/lib/couple";

export default function Home() {
  return (
    <main className="landing-shell">
      <div className="moon" aria-hidden="true" />
      <section className="landing-card">
        <p className="eyebrow">TEMPLATE UNDANGAN PERSONAL</p>
        <p className="script">A celebration under the moon</p>
        <h1>{couple.bride} <span>&amp;</span> {couple.groom}</h1>
        <p className="intro">Satu fondasi untuk undangan indah, daftar tamu yang tertata, dan RSVP yang mudah dipantau.</p>
      </section>
      <section className="how" id="cara-kerja">
        <article><b>01</b><h2>Link personal</h2><p>Setiap tamu menerima token undangan sendiri.</p></article>
        <article><b>02</b><h2>Akses perangkat</h2><p>Perangkat pertama dapat diikat sebagai pengaman tambahan.</p></article>
        <article><b>03</b><h2>RSVP tersimpan</h2><p>Konfirmasi dan ucapan masuk ke PostgreSQL.</p></article>
      </section>
    </main>
  );
}
