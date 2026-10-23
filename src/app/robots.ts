import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Le pagine non indicizzabili hanno già `noindex`: devono poter essere scansionate perché il crawler lo veda.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${SITE}/sitemap.xml` };
}
