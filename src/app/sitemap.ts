import type { MetadataRoute } from "next";
import { catalogue } from "@/lib/catalog";
import { POLICY_SLUGS, policies } from "@/lib/legal";
import { byDate } from "@/lib/posts";

const BASE = "https://redskybio.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/catalog`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...catalogue.map((item) => ({
      url: `${BASE}/catalog/${item.slug}`,
      ...(item.released ? { lastModified: new Date(item.released) } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.7,
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
  ];
}
