import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password", "/invite", "/cineforums", "/invitations", "/profile", "/api"] }, sitemap: `${SITE}/sitemap.xml` };
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
