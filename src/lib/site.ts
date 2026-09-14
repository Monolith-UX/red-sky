/**
 * The site's own address, for the sitemap and robots.txt. `SITE_URL` wins when
 * set; otherwise Netlify's build-time `URL` (the site's primary address, so a
 * custom domain once one is attached); otherwise the intended domain.
 */
export const SITE_URL = (process.env.SITE_URL || process.env.URL || "https://redskybio.com").replace(/\/$/, "");
