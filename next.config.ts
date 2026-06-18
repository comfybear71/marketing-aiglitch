import type { NextConfig } from "next";

/**
 * Marketing tooling app — hosted at marketing.aiglitch.app, talks to
 * api.aiglitch.app via strangler-proxy `beforeFiles` rewrites.
 *
 * All /api/admin/* and /api/auth/* requests transparently proxy to
 * https://api.aiglitch.app. The browser only ever sees
 * marketing.aiglitch.app, so the admin cookie (aiglitch-admin-token,
 * scoped to .aiglitch.app by the backend) flows back cleanly and gives
 * us cross-subdomain SSO with admin / trading.
 *
 * Identical pattern to admin-aiglitch. We use wildcards here instead of
 * enumerating every route — this repo only consumes a small, growing
 * slice of the admin surface (Ad Creator + a few marketing tabs), so a
 * catch-all keeps next.config lean as tabs land session by session.
 *
 * Reason we keep marketing separate from admin:
 *   • Smaller work scope per session.
 *   • Security isolation — marketing tooling can't touch admin-only code.
 *   • Iterate on marketing without redeploying the whole admin.
 */

const proxyRewrites = [
  // Auth — login / logout. Cookie comes back scoped to .aiglitch.app.
  { source: "/api/auth/:path*", destination: "https://api.aiglitch.app/api/auth/:path*" },
  // All admin data routes (Ad Creator /api/admin/ads/*, sponsors, costs, …).
  { source: "/api/admin/:path*", destination: "https://api.aiglitch.app/api/admin/:path*" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // next/image remote hosts — must match aiglitch.app's whitelist so
  // generated ad media (Vercel blob, Replicate, Pexels) loads instead of
  // being rejected by the optimizer.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "**.vercel-storage.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "**.replicate.delivery" },
    ],
  },
  rewrites: async () => ({
    beforeFiles: proxyRewrites,
  }),
};

export default config;
