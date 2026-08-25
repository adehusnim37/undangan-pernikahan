import nodemailer from "nodemailer";
import { getSmtpConfig } from "@/lib/config";

const globalForMailer = globalThis as typeof globalThis & {
  adminOtpTransport?: ReturnType<typeof nodemailer.createTransport>;
};

function transport() {
  if (globalForMailer.adminOtpTransport) return globalForMailer.adminOtpTransport;
  const smtp = getSmtpConfig();
  globalForMailer.adminOtpTransport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    requireTLS: smtp.port !== 465,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    tls: { minVersion: "TLSv1.2" },
  });
  return globalForMailer.adminOtpTransport;
}

export async function sendAdminOtp(email: string, code: string) {
  const smtp = getSmtpConfig();
  await transport().sendMail({
    from: { name: smtp.fromName, address: smtp.fromEmail },
    to: email,
    subject: "Kode verifikasi admin undangan",
    text: [
      "Gunakan kode berikut untuk menyelesaikan login admin:",
      "",
      code,
      "",
      "Kode berlaku 10 menit dan hanya dapat digunakan satu kali.",
      "Jika kamu tidak mencoba login, abaikan email ini dan pertimbangkan mengganti password admin.",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;color:#17332b;line-height:1.6"><p>Gunakan kode berikut untuk menyelesaikan login admin:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>Kode berlaku 10 menit dan hanya dapat digunakan satu kali.</p><p>Jika kamu tidak mencoba login, abaikan email ini dan pertimbangkan mengganti password admin.</p></div>`,
  });
}
