import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mwrd/shared", "@mwrd/auth-public"],
};

export default nextConfig;
