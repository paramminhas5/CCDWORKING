/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  reactStrictMode: true,
  // Enable gzip/brotli compression and reduce JS payload
  compress: true,
  // Tree-shake barrel imports from large packages (experimental in Next 14)
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "react-icons",
      "lucide-react",
      "recharts",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "date-fns",
    ],
  },
  images: {
    // Serve modern formats (avif/webp) for faster image loading
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**.myshopify.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "catscandance.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  // Produce smaller output by enabling SWC minification (default in Next 14+)
  swcMinify: true,
  webpack(config) {
    return config;
  },
  async headers() {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          // Cache static assets aggressively
          source: "/_next/static/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        {
          // Cache images
          source: "/(.*)\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
          ],
        },
      ];
    }
    return [{ source: "/(.*)", headers: [{ key: "Cache-Control", value: "no-store" }] }];
  },
};
export default nextConfig;
