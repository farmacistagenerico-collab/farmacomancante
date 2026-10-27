import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node:sqlite e gli altri moduli nodi vengono mantenuti esterni al bundle
  serverExternalPackages: ["node:sqlite"],
};

export default nextConfig;
