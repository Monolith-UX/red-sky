import type { MetadataRoute } from "next";

/** Points crawlers at the sitemap and away from anything personal. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/cart", "/api/", "/stories/review"] },
    sitemap: "https://redskybio.com/sitemap.xml",
  };
}
