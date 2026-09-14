import type { MetadataRoute } from "next";
import { catalogue, released } from "@/lib/catalog";
import { POLICY_SLUGS, policies } from "@/lib/legal";
import { byDate } from "@/lib/posts";

const BASE = "https://redskybio.com";

/** The newest date among a set, so an index page changes when anything in it does. */
const latest = (dates: string[]) => new Date(dates.reduce((a, b) => (a > b ? a : b)));

/**
 * Every public page. Account, cart and the API are private and left out;
 * robots.ts keeps crawlers away from them as well.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const newestLot = latest(released.map((c) => c.released));
  const newestPost = latest(byDate.map((p) => p.date));

  return [
    { url: BASE, lastModified: newestLot, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/catalog`, lastModified: newestLot, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/blog`, lastModified: newestPost, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.5 },
    ...catalogue.map((item) => ({
      url: `${BASE}/catalog/${item.slug}`,
      ...(item.released ? { lastModified: new Date(item.released) } : {}),
      changeFrequency: "monthly" as const,
      priority: item.stock === "upcoming" ? 0.5 : 0.7,
    })),
    ...byDate.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...POLICY_SLUGS.map((slug) => ({
      url: `${BASE}/${slug}`,
      lastModified: new Date(policies[slug].updated),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    { url: `${BASE}/sitemap`, changeFrequency: "monthly", priority: 0.2 },
  ];
}
