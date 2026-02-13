import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  reactStrictMode: true,
  // En Next.js 16, Turbopack se deshabilita usando el flag --webpack en los scripts de package.json
  // turbopack: false,
  // Standalone output para Docker deployment
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
