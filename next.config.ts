import type { NextConfig } from "next";

/**
 * Next 16 runs every <Link> navigation inside startTransition and the bundled
 * React exports <ViewTransition>, so no experimental flag is needed.
 */
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Certificate PDFs are uploaded through a Server Action (capped at 4 MB in the
      // action; Netlify's function request limit is about 6 MB). The default is 1 MB.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
