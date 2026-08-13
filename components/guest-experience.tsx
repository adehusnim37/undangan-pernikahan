"use client";

import { useEffect, useState } from "react";
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

export function GuestExperience({ invitation }: { invitation: Invitation }) {
  const {
    thumbmark,
    isLoading: isLoadingThumbmark,
    error: thumbmarkError,
  } = useThumbmark();
  const [access, setAccess] = useState<AccessState>("checking");
  const [deviceHash, setDeviceHash] = useState("");
  const [notice, setNotice] = useState("Memverifikasi undangan pribadimu…");
  const [attendance, setAttendance] = useState("attending");
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [rsvpState, setRsvpState] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [existingRsvp, setExistingRsvp] = useState<Rsvp | null>(null);

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
      const response = await fetch(
        `/api/public/invite/${invitation.token}/access`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            hash,
            metadata: { source: "thumbmarkjs" },
          }),
        },
      );
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Akses undangan tidak dapat diverifikasi."));
      }
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

  async function submitRsvp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validateWithToast(rsvpFormSchema, {
      attendance,
      guestCount,
      message,
      hash: deviceHash,
    });
    if (!payload) return;
    setRsvpState("sending");
    try {
      const response = await fetch(
        `/api/public/invite/${invitation.token}/rsvp`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Konfirmasi belum tersimpan."));
      setRsvpState("done");
      setExistingRsvp((prev) => ({
        attendance: payload.attendance,
        guest_count: payload.guestCount,
        message: payload.message || null,
        updated_at: new Date().toISOString(),
        current_editable_rsvps: (prev?.current_editable_rsvps ?? 0) + 1,
        max_editable_rsvps: prev?.max_editable_rsvps ?? 2,
      }));
      toast.success("Konfirmasi kehadiran tersimpan.");
    } catch (error) {
      setRsvpState("error");
      toast.error(error instanceof Error ? error.message : "Konfirmasi belum tersimpan.");
    }
  }

  if (access === "checking")
    return (
      <main className="gate">
        <div className="gate-spinner" />
        <p>{notice}</p>
      </main>
    );
  if (access === "denied")
    return (
      <main className="gate">
        <p className="eyebrow">AKSES PRIBADI</p>
        <h1>Undangan ini terikat pada perangkat lain.</h1>
        <p>{notice}</p>
        <small>Hubungi mempelai agar akses dapat diatur ulang.</small>
      </main>
    );

  return (
    <main className="invitation">
      <header className="invite-hero">
        <p className="eyebrow">THE WEDDING OF</p>
        <p className="guest-line">
          Kepada Yth. <b>{invitation.guest_name}</b>
        </p>
        <div className="botanical-mark" aria-hidden="true">
          ✦
        </div>
        <h1>
          Aruna <i>&amp;</i> Bima
        </h1>
        <p className="date">Minggu, 09 Agustus 2026 · Jakarta</p>
        <a href="#rsvp" className="scroll-cue">
          Gulir untuk membuka <span>↓</span>
        </a>
      </header>
      <section className="story-section">
        <p className="eyebrow">DENGAN SUKACITA</p>
        <h2>
          Dalam teduh malam,
          <br />
          kami memilih pulang.
        </h2>
        <p>
          Kehadiran dan doa baikmu akan menjadi bagian yang kami kenang saat
          memulai hidup bersama.
        </p>
      </section>
      <section className="event-card">
        <p className="eyebrow">AKAD &amp; RESEPSI</p>
        <h2>09 · 08 · 26</h2>
        <div className="event-grid">
          <p>
            <b>Akad Nikah</b>
            <br />
            09.00 WIB
          </p>
          <p>
            <b>Resepsi</b>
            <br />
            11.00 — 14.00 WIB
          </p>
        </div>
        <p>
          Ruang Mahameru
          <br />
          Jakarta Selatan
        </p>
        <a
          className="text-link"
          href="https://maps.google.com/?q=Jakarta+Selatan"
          target="_blank"
        >
          Buka peta ↗
        </a>
      </section>
      <section id="rsvp" className="rsvp-section">
        <p className="eyebrow">KONFIRMASI KEHADIRAN</p>
        <h2>Temui kami di hari bahagia.</h2>
        {rsvpState === "done" ? (
          <div className="rsvp-success">
            <b>Terima kasih, {invitation.guest_name}.</b>
            <p>Konfirmasi kehadiranmu sudah kami terima.</p>
            {existingRsvp && (
              <dl className="rsvp-summary">
                <dt>Kehadiran</dt>
                <dd>
                  {existingRsvp.attendance === "attending"
                    ? `Hadir · ${existingRsvp.guest_count} orang`
                    : "Tidak hadir"}
                </dd>
                {existingRsvp.message && (
                  <>
                    <dt>Pesan</dt>
                    <dd>{existingRsvp.message}</dd>
                  </>
                )}
              </dl>
            )}
            <button
              className="text-button"
              onClick={() => setRsvpState("idle")}
              disabled={!!existingRsvp && existingRsvp.current_editable_rsvps >= existingRsvp.max_editable_rsvps}
            >
              {existingRsvp && existingRsvp.current_editable_rsvps >= existingRsvp.max_editable_rsvps
                ? "Konfirmasi tidak dapat diubah lagi"
                : "Ubah konfirmasi"}
            </button>
          </div>
        ) : (
          <form onSubmit={submitRsvp}>
            <label>
              Apakah kamu dapat hadir?
              <select
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
              >
                <option value="attending">Dengan senang hati hadir</option>
                <option value="declined">Maaf, belum dapat hadir</option>
              </select>
            </label>
            {attendance === "attending" && (
              <>
                <label>
                  Jumlah tamu
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                  >
                    {Array.from(
                      { length: invitation.max_guests },
                      (_, index) => (
                        <option key={index} value={index + 1}>
                          {index + 1} orang
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </>
            )}
            <label>
              Ucapan atau doa{" "}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                placeholder="Tulis pesan untuk kedua mempelai"
              />
            </label>
            <button
              className="button button-solid"
              disabled={rsvpState === "sending"}
            >
              {rsvpState === "sending" ? "Menyimpan…" : "Kirim konfirmasi"}
            </button>
            {rsvpState === "error" && (
              <p className="form-error">
                Konfirmasi belum tersimpan. Coba ulangi.
              </p>
            )}
          </form>
        )}
      </section>
      <footer>Aruna &amp; Bima · 2026</footer>
    </main>
  );
}
