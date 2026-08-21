import type { Metadata } from "next";
import "./globals.css";
import { InvitationThumbmarkProvider } from "@/components/thumbmark-provider";
import { couple } from "@/lib/couple";

export const metadata: Metadata = {
  title: `${couple.name} — Undangan Pernikahan`,
  description: `Undangan pernikahan pribadi ${couple.name}.`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      {/* suppressHydrationWarning prevents noise from browser extensions (e.g. Grammarly) mutating <body> */}
      <body>
        <InvitationThumbmarkProvider>{children}</InvitationThumbmarkProvider>
      </body>
    </html>
  );
}
