/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://catscandance.com",
  generateRobotsTxt: false, // we maintain robots.txt manually
  outDir: "public",
  generateIndexSitemap: true,
  sitemapSize: 7000,
  exclude: [
    "/admin",
    "/api/*",
    "/reset-password",
    "/404",
    "/ccdxsocial/proposal", // private partner doc
    "/embed/*",
  ],
  transform: async (config, path) => {
    // Event detail pages — highest priority, checked daily
    if (path.startsWith("/events/") && path !== "/events/") {
      return { loc: path, changefreq: "daily", priority: 0.9, lastmod: new Date().toISOString() };
    }
    // Primary pages
    const high = ["/", "/events", "/ccdxsocial", "/videos", "/playlists", "/shop"];
    if (high.includes(path)) {
      return { loc: path, changefreq: "weekly", priority: path === "/" ? 1.0 : 0.85, lastmod: new Date().toISOString() };
    }
    // Partner / info pages
    return { loc: path, changefreq: "monthly", priority: 0.6, lastmod: new Date().toISOString() };
  },
};
