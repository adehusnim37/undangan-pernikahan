import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./db/migrations/*.sql"],
  },
};

export default nextConfig;
