import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
  },
  // Turbopack options are handled automatically in Next 15, but we can add specific ones if needed
};

export default nextConfig;
