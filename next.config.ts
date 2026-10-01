import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs-dist) must not be bundled: its dynamic worker import
  // resolves at runtime from node_modules.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
