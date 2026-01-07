import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack to use webpack configuration
  // Remove this line if you want to use Turbopack (but PDF.js may have issues)
  webpack: (config, { isServer }) => {
    // Disable canvas and encoding for pdf.js compatibility
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Handle PDF.js worker files properly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Add rule for handling .mjs files from pdfjs-dist
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    return config;
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["pdfjs-dist"],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
