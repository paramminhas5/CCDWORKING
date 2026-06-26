/**
 * /api/events — Server-side CRUD for events.
 *
 * Methods:
 *   POST   → Create a new event
 *   DELETE  → Delete an event by id (query param ?id=...)
 *
 * Auth: Requires a valid Supabase session with role = "admin".
 * After mutation, triggers ISR revalidation for affected paths.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Verify the request has a valid admin session.
 * Expects Authorization: Bearer <access_token>
 */
async function verifyAdmin(req: NextApiRequest): Promise<{ valid: boolean; error?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { valid: false, error: "Invalid or expired token" };
  }

  const role = user.app_metadata?.role;
  if (role !== "admin") {
    return { valid: false, error: "Not authorized — admin role required" };
  }

  return { valid: true };
}

/**
 * Trigger ISR revalidation for event-related pages.
 */
async function revalidatePaths(res: NextApiResponse, slug?: string) {
  try {
    // Revalidate the events listing page
    await res.revalidate("/events");
    // Revalidate the specific event page if slug provided
    if (slug) {
      await res.revalidate(`/events/${slug}`);
    }
    // Revalidate homepage (shows upcoming events)
    await res.revalidate("/");
  } catch {
    // Non-fatal — ISR will catch up within 60s anyway
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST and DELETE
  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed. Use POST or DELETE." });
  }

  // Verify admin auth
  const auth = await verifyAdmin(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  const admin = getAdminClient();
  if (!admin) {
    return res.status(500).json({ error: "Server not configured — missing SUPABASE_SERVICE_KEY" });
  }

  // ── POST: Create event ──────────────────────────────────────────────────
  if (req.method === "POST") {
    const body = req.body;

    // Validate required fields
    const required = ["slug", "title", "date", "city", "venue", "status"] as const;
    const missing = required.filter((f) => !body[f]?.toString().trim());
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    // Validate slug format (lowercase, hyphens, numbers only)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(body.slug)) {
      return res.status(400).json({
        error: "Invalid slug format. Use lowercase letters, numbers, and hyphens only (e.g. 'my-event-01').",
      });
    }

    // Validate status
    if (!["upcoming", "past"].includes(body.status)) {
      return res.status(400).json({ error: "Status must be 'upcoming' or 'past'" });
    }

    // Check for duplicate slug
    const { data: existing } = await admin
      .from("events")
      .select("id")
      .eq("slug", body.slug)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: `An event with slug "${body.slug}" already exists` });
    }

    // Build the event row
    const eventRow = {
      slug: body.slug.trim(),
      title: body.title.trim(),
      date: body.date.trim(),
      city: body.city.trim(),
      venue: body.venue.trim(),
      blurb: body.blurb?.trim() || "",
      lineup: Array.isArray(body.lineup) ? body.lineup : [],
      status: body.status,
      poster_url: body.poster_url?.trim() || null,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 99,
      series: body.series?.trim() || null,
      series_label: body.series_label?.trim() || null,
      event_type: body.event_type?.trim() || "standard",
      pet_friendly: body.pet_friendly ?? false,
      series_tagline: body.series_tagline?.trim() || null,
      is_finale: body.is_finale ?? false,
    };

    const { data, error } = await admin
      .from("events")
      .insert(eventRow)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Trigger ISR revalidation
    await revalidatePaths(res, eventRow.slug);

    return res.status(201).json({ event: data, revalidated: true });
  }

  // ── DELETE: Remove event ────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const id = req.query.id as string;
    if (!id) {
      return res.status(400).json({ error: "Query parameter 'id' is required" });
    }

    // Get the event first (for slug-based revalidation)
    const { data: event } = await admin
      .from("events")
      .select("slug")
      .eq("id", id)
      .single();

    const { error } = await admin.from("events").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Trigger ISR revalidation
    await revalidatePaths(res, event?.slug);

    return res.status(200).json({ deleted: true, id, revalidated: true });
  }
}
