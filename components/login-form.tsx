"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/client-api";
import {
  loginFormSchema,
  otpFormSchema,
  validateWithToast,
} from "@/lib/client-validation";

type LoginStep = "credentials" | "otp";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(
      () => setResendIn((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function submitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validateWithToast(loginFormSchema, { email, password });
    if (!payload) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Gagal masuk."));
      }
      const result = (await response.json()) as {
        requiresOtp: boolean;
        destination: string;
      };
      if (!result.requiresOtp) throw new Error("Respons login tidak valid.");
      setDestination(result.destination);
      setPassword("");
      setStep("otp");
      setResendIn(60);
      toast.info("Kode verifikasi telah dikirim.");
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Gagal masuk.";
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  async function submitOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validateWithToast(otpFormSchema, { code });
    if (!payload) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, "Kode tidak dapat diverifikasi."),
        );
      }
      toast.success("Berhasil masuk ke ruang pengelola.");
      router.replace("/admin");
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Kode tidak dapat diverifikasi.";
      setError(message);
      toast.error(message);
      setCode("");
    } finally {
      setSending(false);
    }
  }

  async function resend() {
    if (resendIn > 0 || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/otp/resend", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, "Kode belum dapat dikirim ulang."),
        );
      }
      setCode("");
      setResendIn(60);
      toast.info("Kode baru telah dikirim. Kode sebelumnya tidak berlaku.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Kode belum dapat dikirim ulang.";
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  function restart() {
    setStep("credentials");
    setCode("");
    setDestination("");
    setError("");
    setResendIn(0);
  }

  return (
    <section className="login-card">
      <p className="eyebrow">RUANG PENGELOLA</p>
      <h1>
        {step === "credentials"
          ? "Masuk untuk mengatur tamu."
          : "Verifikasi login."}
      </h1>
      {step === "credentials" ? (
        <form onSubmit={submitCredentials}>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-solid" disabled={sending}>
            {sending ? "Memeriksa…" : "Lanjutkan"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitOtp}>
          <p className="login-helper">
            Masukkan kode 8 angka yang dikirim ke <b>{destination}</b>. Kode
            berlaku selama 10 menit.
          </p>
          <label>
            Kode OTP
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{8}"
              minLength={8}
              maxLength={8}
              required
              autoFocus
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="00000000"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-solid" disabled={sending}>
            {sending ? "Memverifikasi…" : "Verifikasi dan masuk"}
          </button>
          <div className="login-secondary-actions">
            <button
              className="text-button"
              type="button"
              disabled={sending || resendIn > 0}
              onClick={resend}
            >
              {resendIn > 0 ? `Kirim ulang (${resendIn})` : "Kirim ulang kode"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
