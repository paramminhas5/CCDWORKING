// Nightly event scraper (2am IST). Netlify runs this on schedule and calls the site's own API route
// with the CRON_SECRET bearer token, the same contract the route expects.
import type { Config } from "@netlify/functions";

export default async () => {
  const base = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://catscandance.com";
  const secret = process.env.CRON_SECRET || "";
  if (!secret) {
    console.log("[cron-scrape-events] CRON_SECRET is not set; skipping");
    return new Response("CRON_SECRET not set", { status: 200 });
  }
  const res = await fetch(`${base}/api/cron/scrape-events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const text = await res.text();
  console.log(`[cron-scrape-events] ${res.status} ${text.slice(0, 300)}`);
  return new Response(null, { status: res.ok ? 200 : 500 });
};

export const config: Config = { schedule: "30 20 * * *" };
