import type { NextConfig } from "next";

const backend = process.env.BACKEND_URL ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  async headers() {
    // il token d'invito sta nell'URL: non deve finire nel Referer
    return [{ source: "/invite", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/sub/api/:path*` }];
  },
};

export default nextConfig;
