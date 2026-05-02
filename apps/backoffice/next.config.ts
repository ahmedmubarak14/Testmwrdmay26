import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backoffice transpiles ONLY @mwrd/shared. It deliberately does NOT include
  // @mwrd/auth-public — backoffice has its own auth in lib/auth.ts.
  transpilePackages: ["@mwrd/shared"],
};

export default nextConfig;
