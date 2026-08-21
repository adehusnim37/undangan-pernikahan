import type { NextConfig } from "next";

const securityHeaders = [
  // Cegah kebocoran token undangan (ada di path URL) via Referer lintas-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking: undangan terikat perangkat + panel admin tidak boleh di-frame.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
  },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./db/migrations/*.sql"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
