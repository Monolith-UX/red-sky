import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Points crawlers at the sitemap and away from anything personal. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/cart", "/api/", "/stories/review", "/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
