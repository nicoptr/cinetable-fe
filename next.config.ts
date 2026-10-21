import type { NextConfig } from "next";

// rewrites, metadataBase e sitemap si fissano alla build: in production devono esserci già
if (process.env.NODE_ENV === "production") {
  const missing = ["BACKEND_URL", "NEXT_PUBLIC_SITE_URL"].filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Variabili d'ambiente mancanti per la build/avvio di production: ${missing.join(", ")}`);
}

const backend = process.env.BACKEND_URL ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // il token d'invito sta nell'URL: non deve finire nel Referer (l'ultima regola vince sulla stessa chiave)
      { source: "/invite", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/sub/api/:path*` }];
  },
};

export default nextConfig;
