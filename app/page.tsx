import { couple } from "@/lib/couple";
import { getInvitationMedia } from "@/lib/invitations";
import { invitationMediaBySlot } from "@/lib/invitation-media";

export const dynamic = "force-dynamic";

export default async function Home() {
  const media = await getInvitationMedia();
  const preweddingPhoto =
    media.prewedding_1?.url ?? invitationMediaBySlot.prewedding_1.defaultUrl;

  return (
    <main className="home-page">
      <section className="home-cover" aria-labelledby="home-title">
        <span className="home-watermark" aria-hidden="true">A&amp;A</span>
        <figure className="home-cover-decoration">
          <img
            src={preweddingPhoto}
            alt={`Foto prewedding ${couple.groom} dan ${couple.bride}`}
          />
        </figure>
        <header className="home-cover-header">
          <span>UNDANGAN PERNIKAHAN</span>
        </header>
        <div className="home-cover-copy">
          <p className="home-kicker">Dengan penuh syukur</p>
          <h1 id="home-title">
            <span>{couple.groom}</span>
            <i>&amp;</i>
            <span>{couple.bride}</span>
          </h1>
          <p className="home-intro">Kami mengundangmu untuk menjadi bagian dari hari bahagia kami.</p>
        </div>
        <footer className="home-cover-footer">
          <span>Mohon doa restu dan kehadirannya.</span>
        </footer>
      </section>
    </main>
  );
}
