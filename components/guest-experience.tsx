"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import type { Invitation } from "@/lib/invitations";
import { useThumbmark } from "@thumbmarkjs/react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/client-api";
import { rsvpFormSchema, validateWithToast } from "@/lib/client-validation";

type AccessState = "checking" | "allowed" | "denied";
type Rsvp = {
  attendance: string;
  guest_count: number;
  message: string | null;
  updated_at: string;
  current_editable_rsvps: number;
  max_editable_rsvps: number;
};

const galleryPhotos = [
  ["https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=88", "A quiet beginning"],
  ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=88", "The one who stayed"],
  ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1500&q=90", "A day to remember"],
  ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=88", "Soft light"],
  ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=88", "A familiar face"],
  ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=88", "Before the music"],
  ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=88", "The afterglow"],
] as const;

export function GuestExperience({ invitation }: { invitation: Invitation }) {
  const invitationRef = useRef<HTMLElement>(null);
  const rsvpFormRef = useRef<HTMLFormElement>(null);
  const { thumbmark, isLoading: isLoadingThumbmark, error: thumbmarkError } = useThumbmark();
  const [access, setAccess] = useState<AccessState>("checking");
  const [deviceHash, setDeviceHash] = useState("");
  const [notice, setNotice] = useState("Memverifikasi undangan pribadimu…");
  const [attendance, setAttendance] = useState("attending");
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [rsvpState, setRsvpState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [existingRsvp, setExistingRsvp] = useState<Rsvp | null>(null);

  useEffect(() => {
    if (access !== "allowed") return;
    const root = invitationRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger, Flip);
    const responsiveMotion = gsap.matchMedia();
    const context = gsap.context(() => {
      const hero = root.querySelector<HTMLElement>(".folio-hero");
      const focusPhoto = root.querySelector<HTMLElement>(".folio-photo--focus");
      const title = root.querySelector<HTMLElement>(".folio-title");
      const kicker = root.querySelector<HTMLElement>(".folio-kicker");
      const accent = root.querySelector<HTMLElement>(".folio-title em");
      const guest = root.querySelector<HTMLElement>(".folio-guest");
      const bar = root.querySelector<HTMLElement>(".folio-bar");
      const cue = root.querySelector<HTMLElement>(".folio-scroll");
      const storySection = root.querySelector<HTMLElement>(".folio-story");
      const story = root.querySelector<HTMLElement>(".folio-story-copy");
      const storyGhost = root.querySelector<HTMLElement>(".folio-story-ghost");
      const storyRule = root.querySelector<HTMLElement>(".folio-story-rule");
      const storyMeta = root.querySelector<HTMLElement>(".folio-story-meta");
      const storySide = root.querySelector<HTMLElement>(".folio-story-side");
      const journey = root.querySelector<HTMLElement>(".journey-section");
      const journeyTrack = root.querySelector<HTMLElement>(".journey-track");
      const journeyPanels = root.querySelectorAll<HTMLElement>(".journey-panel");
      const journeyProgress = root.querySelector<HTMLElement>(".journey-progress span");
      const routePath = root.querySelector<SVGPathElement>(".journey-route-path");
      const rsvp = root.querySelector<HTMLElement>(".rsvp-section");
      const footer = root.querySelector<HTMLElement>(".folio-footer");
      const footerName = root.querySelector<HTMLElement>(".folio-footer-name");
      const footerCurtainLeft = root.querySelector<HTMLElement>(".folio-footer-curtain--left");
      const footerCurtainRight = root.querySelector<HTMLElement>(".folio-footer-curtain--right");
      const footerRule = root.querySelector<HTMLElement>(".folio-footer-rule");
      const footerCopy = root.querySelectorAll<HTMLElement>(".folio-footer-kicker, .folio-footer-note, .folio-footer-date");

      if (hero && focusPhoto && title && kicker && accent && guest && bar && cue) {
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: hero, start: "top top", end: "+=180%", scrub: 1, pin: true, anticipatePin: 1 },
        });
        timeline
          .to(bar, { opacity: 0, y: -18, duration: 0.18 }, 0)
          .to(cue, { opacity: 0, y: 16, duration: 0.18 }, 0.08)
          .to(".folio-photo:not(.folio-photo--focus)", {
            x: (index) => `${index % 2 === 0 ? -1 : 1}${8 + index * 1.6}vw`,
            y: (index) => `${index % 2 === 0 ? 9 : -9}vh`,
            opacity: 0,
            scale: 0.72,
            rotate: (index) => (index % 2 === 0 ? -8 : 8),
            stagger: 0.035,
            duration: 0.48,
          }, 0.18)
          .to(focusPhoto, {
            left: "0%", top: "0%", width: "100%", height: "100%", borderRadius: 0,
            rotation: 0, scale: 1.08, duration: 0.7, ease: "power2.inOut",
          }, 0.35)
          .to(title, { color: "#f5f1e8", scale: 1.04, yPercent: 8, duration: 0.38 }, 0.72)
          .to(kicker, { color: "#d9c8a5", duration: 0.28 }, 0.72)
          .to(accent, { color: "#d9c8a5", duration: 0.28 }, 0.72)
          .to(guest, { color: "#f5f1e8", scale: 1.08, duration: 0.28 }, 0.72);
      }

      if (storySection && story && storyGhost && storyRule && storyMeta && storySide) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          gsap.set([storyMeta, storySide, story, storyRule, storyGhost], { clearProps: "all" });
        } else {
          const storyTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: storySection,
              start: "top top",
              end: () => `+=${window.innerWidth <= 700 ? window.innerHeight * 0.72 : window.innerHeight * 0.62}`,
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          storyTimeline
            .fromTo(storyMeta, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: "none" }, 0)
            .fromTo(storySide, { x: -22, opacity: 0 }, { x: 0, opacity: 1, duration: 0.32, ease: "none" }, 0.04)
            .fromTo(story, { y: 64, opacity: 0 }, { y: 0, opacity: 1, duration: 0.64, ease: "none" }, 0.08)
            .fromTo(storyRule, { scaleX: 0 }, { scaleX: 1, duration: 0.34, ease: "none" }, 0.18)
            .fromTo(storyGhost, { xPercent: 12, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.58, ease: "none" }, 0.12);
        }
      }

      if (journey && journeyTrack && journeyPanels.length && journeyProgress) {
        responsiveMotion.add("(min-width: 701px)", () => {
          const horizontalJourney = gsap.to(journeyTrack, {
            x: () => -(journeyTrack.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
              trigger: journey,
              start: "top top",
              end: () => `+=${window.innerWidth * (journeyPanels.length - 1)}`,
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          gsap.fromTo(
            journeyProgress,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: journey,
                start: "top top",
                end: () => `+=${window.innerWidth * (journeyPanels.length - 1)}`,
                scrub: 1,
              },
            },
          );

          journeyPanels.forEach((panel) => {
            const photos = panel.querySelectorAll<HTMLElement>(".journey-photo");
            if (!photos.length) return;
            gsap.fromTo(
              photos,
              { yPercent: (index) => (index % 2 === 0 ? 18 : -14), scale: 0.82 },
              {
                yPercent: (index) => (index % 2 === 0 ? -12 : 10),
                scale: 1,
                ease: "none",
                stagger: 0.04,
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: horizontalJourney,
                  start: "left 92%",
                  end: "right 8%",
                  scrub: 1,
                },
              },
            );
          });

          if (routePath) {
            const pathLength = routePath.getTotalLength();
            gsap.set(routePath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
            gsap.to(routePath, {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: {
                trigger: ".journey-panel--distance",
                containerAnimation: horizontalJourney,
                start: "left 80%",
                end: "right 35%",
                scrub: 1,
              },
            });
          }
        });

        responsiveMotion.add("(max-width: 700px)", () => {
          journeyPanels.forEach((panel) => {
            gsap.fromTo(
              panel.querySelector(".journey-copy"),
              { y: 48, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: { trigger: panel, start: "top 86%", end: "top 45%", scrub: 0.75 },
              },
            );
            gsap.fromTo(
              panel.querySelectorAll(".journey-photo"),
              { y: 54, scale: 0.9 },
              {
                y: -18,
                scale: 1,
                stagger: 0.08,
                ease: "none",
                scrollTrigger: { trigger: panel, start: "top 92%", end: "bottom 40%", scrub: 0.8 },
              },
            );
          });

          if (routePath) {
            const pathLength = routePath.getTotalLength();
            gsap.set(routePath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
            gsap.to(routePath, {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: { trigger: ".journey-route", start: "top 82%", end: "bottom 42%", scrub: 1 },
            });
          }
        });
      }

      if (rsvp) gsap.fromTo(rsvp, { y: 50, opacity: 0 }, { y: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: rsvp, start: "top 84%" } });
      if (footer && footerName && footerCurtainLeft && footerCurtainRight && footerRule) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          gsap.set([footerCurtainLeft, footerCurtainRight], { xPercent: 0, yPercent: 0 });
          gsap.set([footerName, footerRule, footerCopy], { clearProps: "all" });
        } else {
          const mobileClosing = window.matchMedia("(max-width: 700px)").matches;
          const closingTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: footer,
              start: "top bottom",
              end: "top top",
              scrub: 0.85,
            },
          });

          closingTimeline
            .fromTo(footerCurtainLeft, mobileClosing ? { yPercent: -101 } : { xPercent: -101 }, mobileClosing ? { yPercent: 0, duration: 0.52, ease: "power2.inOut" } : { xPercent: 0, duration: 0.52, ease: "power2.inOut" }, 0)
            .fromTo(footerCurtainRight, mobileClosing ? { yPercent: 101 } : { xPercent: 101 }, mobileClosing ? { yPercent: 0, duration: 0.52, ease: "power2.inOut" } : { xPercent: 0, duration: 0.52, ease: "power2.inOut" }, 0)
            .fromTo(footerRule, { scaleX: 0 }, { scaleX: 1, duration: 0.24, ease: "power2.out" }, 0.48)
            .fromTo(footerName, { yPercent: 68, scale: 0.9, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 0.42, ease: "power3.out" }, 0.53)
            .fromTo(footerCopy, { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.035, duration: 0.28, ease: "power2.out" }, 0.68);
        }
      }
    }, root);
    return () => {
      responsiveMotion.revert();
      context.revert();
    };
  }, [access]);

  useEffect(() => {
    if (rsvpState !== "done" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const success = invitationRef.current?.querySelector<HTMLElement>(".rsvp-success");
    if (!success) return;
    const animation = gsap.fromTo(
      success.children,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, stagger: 0.07, ease: "power3.out" },
    );
    return () => {
      animation.revert();
    };
  }, [rsvpState]);

  useEffect(() => {
    if (isLoadingThumbmark) return;
    if (thumbmarkError) {
      setAccess("denied");
      setNotice("Perangkat ini tidak dapat diverifikasi.");
      toast.error("Perangkat tidak dapat diverifikasi.");
      return;
    }
    if (!thumbmark) return;

    (async () => {
      const hash = thumbmark;
      const response = await fetch(`/api/public/invite/${invitation.token}/access`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hash, metadata: { source: "thumbmarkjs" } }),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Akses undangan tidak dapat diverifikasi."));
      const result = await response.json();
      setAccess(result.allowed ? "allowed" : "denied");
      setDeviceHash(hash ?? "");
      setNotice(result.message);
      if (!result.allowed) toast.error(result.message);
      if (result.rsvp) {
        setExistingRsvp(result.rsvp);
        setAttendance(result.rsvp.attendance);
        setGuestCount(result.rsvp.guest_count);
        setMessage(result.rsvp.message ?? "");
        setRsvpState("done");
      }
    })().catch((error: unknown) => {
      setAccess("denied");
      const errorMessage = error instanceof Error ? error.message : "Perangkat ini tidak dapat diverifikasi.";
      setNotice(errorMessage);
      toast.error(errorMessage);
    });
  }, [invitation.token, isLoadingThumbmark, thumbmark, thumbmarkError]);

  function chooseAttendance(nextAttendance: "attending" | "declined") {
    if (nextAttendance === attendance) return;
    const form = rsvpFormRef.current;
    const indicator = form?.querySelector<HTMLElement>(".rsvp-choice-indicator");
    const flipState = indicator ? Flip.getState(indicator) : null;

    flushSync(() => setAttendance(nextAttendance));

    if (flipState) {
      Flip.from(flipState, {
        duration: 0.62,
        ease: "power3.inOut",
        absolute: true,
        nested: true,
      });
    }

    if (nextAttendance === "attending") {
      const guestField = form?.querySelector<HTMLElement>(".rsvp-guest-field");
      if (guestField) {
        gsap.fromTo(
          guestField,
          { height: 0, opacity: 0, y: 14 },
          { height: "auto", opacity: 1, y: 0, duration: 0.48, ease: "power3.out", clearProps: "height" },
        );
      }
    }
  }

  async function submitRsvp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validateWithToast(rsvpFormSchema, { attendance, guestCount, message, hash: deviceHash });
    if (!payload) return;
    setRsvpState("sending");
    try {
      const response = await fetch(`/api/public/invite/${invitation.token}/rsvp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Konfirmasi belum tersimpan."));
      setRsvpState("done");
      setExistingRsvp((previous) => ({
        attendance: payload.attendance,
        guest_count: payload.guestCount,
        message: payload.message || null,
        updated_at: new Date().toISOString(),
        current_editable_rsvps: (previous?.current_editable_rsvps ?? 0) + 1,
        max_editable_rsvps: previous?.max_editable_rsvps ?? 2,
      }));
      toast.success("Konfirmasi kehadiran tersimpan.");
    } catch (error) {
      setRsvpState("error");
      toast.error(error instanceof Error ? error.message : "Konfirmasi belum tersimpan.");
    }
  }

  if (access === "checking") return <main className="access-screen"><span className="access-mark">A / A</span><div className="gate-spinner" /><p>{notice}</p></main>;
  if (access === "denied") return <main className="access-screen access-screen-denied"><p className="eyebrow">PRIVATE ACCESS</p><h1>Undangan ini terikat pada perangkat lain.</h1><p>{notice}</p><small>Hubungi mempelai agar akses dapat diatur ulang.</small></main>;

  return (
    <main ref={invitationRef} className="invitation-shell">
      <header className="folio-hero">
        <div className="folio-bar"><span>ALVITA + ADE</span><span>JKT · 17.09.26</span></div>
        <div className="folio-gallery" aria-hidden="true">
          {galleryPhotos.map(([src, label], index) => <figure className={`folio-photo folio-photo-${index + 1} ${index === 2 ? "folio-photo--focus" : ""}`} key={src}><img src={src} alt="" /><figcaption>{label}</figcaption></figure>)}
        </div>
        <div className="folio-title"><p className="folio-kicker">SEBUAH PERAYAAN KECIL</p><h1>Alvita <em>&amp;</em> Ade</h1><p className="folio-guest"><span>UNDANGAN UNTUK</span><strong>{invitation.guest_name}</strong></p></div>
        <div className="folio-scroll"><span>SCROLL TO ENTER</span><i>↓</i></div>
      </header>

      <section className="folio-story" aria-labelledby="story-title">
        <div className="folio-story-ghost" aria-hidden="true">pulang</div>
        <div className="folio-story-meta">
          <span>SURAT KECIL DARI KAMI</span>
          <span>ALVITA + ADE / 2016—2026</span>
        </div>
        <div className="folio-story-layout">
          <div className="folio-story-side" aria-hidden="true">
            <span>UNTUKMU</span>
            <i />
            <span>SEBELUM CERITA DIMULAI</span>
          </div>
          <div className="folio-story-copy">
            <p className="eyebrow">DENGAN SUKACITA</p>
            <div className="folio-story-rule" aria-hidden="true" />
            <h2 id="story-title"><span>Dalam teduh</span><span>malam,</span><em>kami memilih pulang.</em></h2>
            <p>Kehadiran dan doa baikmu akan menjadi bagian yang kami kenang saat memulai hidup bersama.</p>
            <p className="folio-story-signature">Dengan hangat,<strong>Alvita <i>&amp;</i> Ade</strong></p>
          </div>
        </div>
        <div className="folio-story-bottom" aria-hidden="true"><span>LANJUTKAN KE CERITA KAMI</span><span>↓</span></div>
      </section>

      <section className="journey-section" aria-labelledby="journey-title">
        <div className="journey-progress" aria-hidden="true"><span /></div>
        <div className="journey-track">
          <article className="journey-panel journey-panel--school">
            <div className="journey-copy">
              <p className="journey-year">2016</p>
              <p className="eyebrow">PERTEMUAN PERTAMA</p>
              <h2 id="journey-title">Satu kelas,<br />satu cerita.</h2>
              <p className="journey-body">Pertemuan kami bermula di SMAN 19 Surabaya. Takdir membawa kami berada di kelas XI yang sama—XI MIPA 4.</p>
            </div>
            <div className="journey-bento journey-bento--school">
              <figure className="journey-photo journey-photo--portrait">
                <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=88" alt="Foto Alvita dan Ade semasa sekolah" />
                <figcaption>Surabaya · 2016</figcaption>
              </figure>
              <div className="journey-school-mark">
                <img src="https://sman19sby.sch.id/wp-content/uploads/2021/06/logo-sekolah2.png" alt="Logo SMAN 19 Surabaya" />
                <span>XI MIPA 4</span>
              </div>
              <figure className="journey-photo journey-photo--detail">
                <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=86" alt="Suasana sekolah" />
              </figure>
            </div>
          </article>

          <article className="journey-panel journey-panel--campus">
            <div className="journey-copy">
              <p className="journey-year">2018—2023</p>
              <p className="eyebrow">BERTUMBUH BERSAMA</p>
              <h2>Dua jalan,<br />satu kota.</h2>
              <p className="journey-body">Kisah cinta SMA kami berlanjut sampai kuliah S1 dan profesi. Kami belajar, bertumbuh, lalu lulus—masih bersama di Surabaya.</p>
              <div className="journey-study">
                <p><span>ALVITA</span>UNAIR · Farmasi hingga Apoteker</p>
                <p><span>ADE</span>UPN “Veteran” Jatim · Ilmu Komputer</p>
              </div>
            </div>
            <div className="journey-bento journey-bento--campus">
              <figure className="journey-photo journey-photo--wide">
                <img src="https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1200&q=88" alt="Masa kuliah Alvita dan Ade di Surabaya" />
                <figcaption>Still in Surabaya</figcaption>
              </figure>
              <figure className="journey-photo journey-photo--small-a"><img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=86" alt="Kelulusan kuliah" /></figure>
              <figure className="journey-photo journey-photo--small-b"><img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=86" alt="Perjalanan selama kuliah" /></figure>
            </div>
          </article>

          <article className="journey-panel journey-panel--distance">
            <div className="journey-copy">
              <p className="journey-year">2024—2026</p>
              <p className="eyebrow">DUA KOTA</p>
              <h2>Jauh di peta,<br />dekat di cerita.</h2>
              <p className="journey-body">Selama dua tahun, Ade bekerja di Jakarta sementara Alvita melanjutkan studi S2 di Yogyakarta hingga lulus.</p>
            </div>
            <div className="journey-route">
              <span className="journey-city journey-city--west">JAKARTA<small>ADE · WORK</small></span>
              <svg viewBox="0 0 640 180" role="img" aria-label="Jalur hubungan jarak jauh Jakarta dan Yogyakarta">
                <path className="journey-route-guide" d="M52 92 C180 18 418 166 588 82" />
                <path className="journey-route-path" d="M52 92 C180 18 418 166 588 82" />
              </svg>
              <span className="journey-city journey-city--east">YOGYAKARTA<small>ALVITA · S2</small></span>
            </div>
            <div className="journey-bento journey-bento--distance">
              <figure className="journey-photo journey-photo--city"><img src="https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=900&q=86" alt="Ade bekerja di Jakarta" /><figcaption>Jakarta</figcaption></figure>
              <figure className="journey-photo journey-photo--graduate"><img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=86" alt="Alvita menyelesaikan studi S2 di Yogyakarta" /><figcaption>Yogyakarta</figcaption></figure>
            </div>
          </article>

          <article className="journey-panel journey-panel--engagement">
            <div className="journey-copy">
              <p className="journey-year">MEI 2026</p>
              <p className="eyebrow">SATU KEPUTUSAN</p>
              <h2>Pulang untuk<br />menetap.</h2>
              <p className="journey-body">Setelah Alvita menyelesaikan studi S2, kami memutuskan melangkah ke jenjang yang lebih serius. Lamaran kami berlangsung pada 30 Mei 2026.</p>
            </div>
            <div className="journey-bento journey-bento--engagement">
              <figure className="journey-photo journey-photo--engagement-main"><img src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=90" alt="Lamaran Alvita dan Ade" /><figcaption>30 · 05 · 2026</figcaption></figure>
              <figure className="journey-photo journey-photo--ring"><img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=88" alt="Cincin lamaran" /></figure>
            </div>
          </article>

          <article className="journey-panel journey-panel--wedding">
            <div className="journey-wedding-photo journey-photo">
              <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=90" alt="Hari pernikahan Alvita dan Ade" />
            </div>
            <div className="journey-wedding-card">
              <p className="eyebrow">SEPULUH TAHUN KEMUDIAN</p>
              <h2>Insya Allah,<br />kami menikah.</h2>
              <p>Kami akan meresmikan kisah cinta SMA ini tepat di hari jadi kami yang ke-10.</p>
              <dl>
                <div><dt>Hari & tanggal</dt><dd>Kamis, 17 September 2026</dd></div>
                <div><dt>Resepsi</dt><dd>11.00—13.00 WIB</dd></div>
                <div><dt>Lokasi</dt><dd>Masjid Istiqlal<br />Jakarta Pusat</dd></div>
              </dl>
              <a className="journey-location" href="https://maps.google.com/?q=Masjid+Istiqlal+Jakarta" target="_blank" rel="noreferrer">Buka lokasi <span>↗</span></a>
            </div>
          </article>
        </div>
      </section>

      <section id="rsvp" className="rsvp-section">
        <div className="rsvp-heading">
          <p className="eyebrow">BALAS UNDANGAN</p>
          <h2>Kami ingin merayakannya bersamamu.</h2>
          <p>Mohon kirim kabar kehadiran sebelum hari acara.</p>
          <span className="rsvp-personal-note">KHUSUS UNTUK · {invitation.guest_name}</span>
        </div>

        {rsvpState === "done" ? (
          <div className="rsvp-success">
            <span className="rsvp-success-index">BALASAN TERSIMPAN</span>
            <b>Terima kasih,<br />{invitation.guest_name}.</b>
            <p>Doa baikmu sudah sampai kepada kami.</p>
            {existingRsvp && (
              <dl className="rsvp-summary">
                <dt>Kehadiran</dt>
                <dd>{existingRsvp.attendance === "attending" ? `Hadir · ${existingRsvp.guest_count} orang` : "Belum dapat hadir"}</dd>
                {existingRsvp.message && <><dt>Pesan</dt><dd>{existingRsvp.message}</dd></>}
              </dl>
            )}
            <button className="text-button" onClick={() => setRsvpState("idle")} disabled={!!existingRsvp && existingRsvp.current_editable_rsvps >= existingRsvp.max_editable_rsvps}>
              {existingRsvp && existingRsvp.current_editable_rsvps >= existingRsvp.max_editable_rsvps ? "Konfirmasi tidak dapat diubah lagi" : "Ubah konfirmasi"}
            </button>
          </div>
        ) : (
          <form ref={rsvpFormRef} className="rsvp-form" onSubmit={submitRsvp}>
            <fieldset className="rsvp-attendance">
              <legend>Apakah kamu bisa hadir?</legend>
              <div className="rsvp-choices">
                <button type="button" className={`rsvp-choice ${attendance === "attending" ? "is-active" : ""}`} aria-pressed={attendance === "attending"} onClick={() => chooseAttendance("attending")}>
                  {attendance === "attending" && <span className="rsvp-choice-indicator" data-flip-id="rsvp-attendance-indicator" />}
                  <span className="rsvp-choice-symbol">+</span>
                  <span><b>Hadir</b><small>Dengan senang hati datang</small></span>
                </button>
                <button type="button" className={`rsvp-choice ${attendance === "declined" ? "is-active" : ""}`} aria-pressed={attendance === "declined"} onClick={() => chooseAttendance("declined")}>
                  {attendance === "declined" && <span className="rsvp-choice-indicator" data-flip-id="rsvp-attendance-indicator" />}
                  <span className="rsvp-choice-symbol">−</span>
                  <span><b>Belum bisa</b><small>Mengirim doa dari jauh</small></span>
                </button>
              </div>
            </fieldset>

            {attendance === "attending" && (
              <div className="rsvp-guest-field">
                <div>
                  <span className="rsvp-field-label">Jumlah tamu</span>
                  <small>Maksimal {invitation.max_guests} orang</small>
                </div>
                <div className="rsvp-stepper" aria-label="Jumlah tamu">
                  <button type="button" onClick={() => setGuestCount((count) => Math.max(1, count - 1))} disabled={guestCount <= 1} aria-label="Kurangi jumlah tamu">−</button>
                  <output aria-live="polite">{guestCount}</output>
                  <button type="button" onClick={() => setGuestCount((count) => Math.min(invitation.max_guests, count + 1))} disabled={guestCount >= invitation.max_guests} aria-label="Tambah jumlah tamu">+</button>
                </div>
              </div>
            )}

            <label className="rsvp-message-field">
              <span className="rsvp-field-label">Ucapan atau doa</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Tuliskan sesuatu untuk Alvita dan Ade…" />
              <small>{message.length} / 500</small>
            </label>

            <div className="rsvp-submit-row">
              <span>Balasan ini dapat diubah kembali sesuai batas yang tersedia.</span>
              <button className="rsvp-submit" disabled={rsvpState === "sending"}>
                <span>{rsvpState === "sending" ? "Menyimpan…" : "Kirim balasan"}</span>
                <i aria-hidden="true">↗</i>
              </button>
            </div>
            {rsvpState === "error" && <p className="form-error">Konfirmasi belum tersimpan. Coba ulangi.</p>}
          </form>
        )}
      </section>

      <footer className="folio-footer">
        <div className="folio-footer-curtains" aria-hidden="true">
          <span className="folio-footer-curtain folio-footer-curtain--left" />
          <span className="folio-footer-curtain folio-footer-curtain--right" />
        </div>
        <div className="folio-footer-closing">
          <div className="folio-footer-opening">
            <p className="folio-footer-kicker">SAMPAI BERTEMU DI HARI BAHAGIA KAMI</p>
            <div className="folio-footer-rule" aria-hidden="true" />
          </div>
          <div className="folio-footer-name"><span>Alvita</span> <em>&amp;</em> <span>Ade</span></div>
          <div className="folio-footer-signoff">
            <p className="folio-footer-note">Dengan cinta, kami menantikan kehadiran dan doa baikmu.</p>
            <time className="folio-footer-date" dateTime="2026-09-17">17 · 09 · 2026</time>
          </div>
        </div>
      </footer>
    </main>
  );
}
