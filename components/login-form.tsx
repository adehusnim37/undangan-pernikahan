"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/client-api";
import { loginFormSchema, validateWithToast } from "@/lib/client-validation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validateWithToast(loginFormSchema, { email, password });
    if (!payload) return;
    setSending(true); setError("");
    try {
      const response = await fetch("/api/admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Gagal masuk."));
      toast.success("Berhasil masuk ke ruang pengelola.");
      router.replace("/admin"); router.refresh();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Gagal masuk.";
      setError(message);
      toast.error(message);
      setSending(false);
    }
  }
  return <section className="login-card"><p className="eyebrow">RUANG PENGELOLA</p><h1>Masuk untuk mengatur tamu.</h1><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@undangan.local" /></label><label>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></label>{error && <p className="form-error">{error}</p>}<button className="button button-solid" disabled={sending}>{sending ? "Memeriksa…" : "Masuk"}</button></form></section>;
}
