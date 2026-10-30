/**
 * GET /api/events
 *
 * Returns site events (CCD-owned events, not curated community events).
 * Filters: ?slug=, ?series=, ?status=, ?event_type=
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, eqf, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { slug, series, status, event_type } = req.query as Record<string, string>;

  const filters: Record<string, string> = { ...ord("sort_order") };
  if (slug)       filters["slug"]       = `eq.${slug}`;
  if (series)     filters["series"]     = `eq.${series}`;
  if (status)     filters["status"]     = `eq.${status}`;
  if (event_type) filters["event_type"] = `eq.${event_type}`;

  const rows = ((await get("events", pq(filters))) ?? []) as Array<Record<string, any>>;

  // An event marked "upcoming" whose date has passed is not upcoming any more.
  // Dates are stored as display text (e.g. "Sun, Jun 28, 2026"); keep rows we
  // can't parse rather than hide them.
  if (status === "upcoming") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stillUpcoming = rows.filter((r) => {
      const t = Date.parse(String(r.date ?? "").replace(/^[A-Za-z]{3},\s*/, ""));
      return Number.isNaN(t) || t >= today.getTime();
    });
    return res.json(stillUpcoming);
  }
  return res.json(rows);
}
