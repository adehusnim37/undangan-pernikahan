import type { Metadata } from "next";
import "./globals.css";
import { InvitationThumbmarkProvider } from "@/components/thumbmark-provider";

export const metadata: Metadata = {
  title: "Ade & Alvita — Undangan Pernikahan",
  description: "Undangan pernikahan pribadi Ade dan Alvita.",
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
