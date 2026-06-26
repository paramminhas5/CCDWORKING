/**
 * NextEventHero — dynamic homepage event showcase.
 *
 * Automatically resolves the next upcoming event from Supabase (with static
 * fallback) and renders a full-width hero with:
 *  - Event poster (or generated placeholder)
 *  - Live countdown
 *  - Lineup preview
 *  - Series badge + pet-friendly indicator
 *  - CTA linking to the event detail page (where RSVP lives)
 *
 * No hardcoded slugs or dates — always shows whatever's next.
 */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@/lib/compat-router";
import { supabase } from "@/lib/supabase";
import { getStaticEventRow, EVENT_ROWS } from "@/content/events";
import { parseEventDate } from "@/lib/parse-date";
import type { EventRow } from "@/types/events";

// ── Countdown hook (SSR-safe) ─────────────────────────────────────────────────
function useCountdown(target: Date | null) {
  const [t, setT] = useState({ days: 0, hours: 0, mins: 0, secs: 0, over: true });
  useEffect(() => {
    if (!target) return;
    const calc = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, over: true };
      const s = Math.floor(diff / 1000);
      return {
        days: Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        mins: Math.floor((s % 3600) / 60),
        secs: s % 60,
        over: false,
      };
    };
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

const Pad = (n: number) => String(n).padStart(2, "0");

// ── Resolve poster URL ────────────────────────────────────────────────────────
function resolvePoster(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("http") || v.startsWith("/")) return v;
  try {
    const { data } = supabase.storage.from("posters").getPublicUrl(v);
    return data?.publicUrl ?? null;
  } catch {
    return null;
  }
}

// ── Static fallback: first upcoming event ─────────────────────────────────────
const STATIC_NEXT = Object.values(EVENT_ROWS)
  .filter((e) => e.status === "upcoming")
  .sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;

// ── Component ─────────────────────────────────────────────────────────────────
const NextEventHero = () => {
  const [event, setEvent] = useState<EventRow | null>(STATIC_NEXT);

  // Hydrate from Supabase
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("events")
          .select("*")
          .eq("status", "upcoming")
          .order("sort_order", { ascending: true })
          .limit(1);
        if (data && data.length > 0) {
          setEvent(data[0] as unknown as EventRow);
        }
      } catch {
        // Keep static fallback
      }
    })();
  }, []);

  if (!event) return null;

  const poster = resolvePoster(event.poster_url);
  const target = parseEventDate(event.date);
  const cd = useCountdown(target);
  const lineup = (event.lineup ?? []).slice(0, 4);

  return (
    <section className="bg-ink border-b-4 border-ink py-12 md:py-20 overflow-hidden">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-display text-acid-yellow text-xs uppercase tracking-[0.3em] mb-4">
            ▶ NEXT EVENT
          </p>
        </motion.div>

        {/* Main content grid */}
        <div className={`grid gap-8 md:gap-12 items-center ${poster ? "md:grid-cols-[1fr_1.1fr]" : ""}`}>
          {/* Poster */}
          {poster && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <Link to={`/events/${event.slug}`} className="block group">
                <div className="relative">
                  <img
                    src={poster}
                    alt={`${event.title} poster`}
                    className="w-full max-w-md mx-auto aspect-[3/4] object-cover border-4 border-cream/20 group-hover:border-acid-yellow transition-colors duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-acid-yellow text-ink font-display text-sm px-4 py-2 border-2 border-ink">
                      VIEW EVENT →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="space-y-6"
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {event.series_label && (
                <span className="font-display text-[10px] px-2.5 py-1 bg-electric-blue text-cream border-2 border-cream/30 uppercase tracking-widest">
                  {event.series_label}
                </span>
              )}
              {event.pet_friendly && (
                <span className="font-display text-[10px] px-2.5 py-1 bg-magenta text-cream border-2 border-cream/30 uppercase tracking-widest">
                  🐾 PET-FRIENDLY
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="font-display text-cream text-4xl sm:text-5xl md:text-6xl leading-[0.85] drop-shadow-[4px_4px_0_hsl(var(--magenta))]">
              {event.title.toUpperCase()}
            </h2>

            {/* Meta grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="font-display text-acid-yellow text-[10px] tracking-widest mb-1">/ DATE</p>
                <p className="font-display text-cream text-sm md:text-base">{event.date}</p>
              </div>
              <div>
                <p className="font-display text-acid-yellow text-[10px] tracking-widest mb-1">/ VENUE</p>
                <p className="font-display text-cream text-sm md:text-base">{event.venue}</p>
              </div>
              <div>
                <p className="font-display text-acid-yellow text-[10px] tracking-widest mb-1">/ CITY</p>
                <p className="font-display text-cream text-sm md:text-base">{event.city}</p>
              </div>
            </div>

            {/* Blurb */}
            <p className="text-cream/70 font-medium text-sm md:text-base leading-relaxed max-w-lg">
              {event.blurb}
            </p>

            {/* Lineup preview */}
            {lineup.length > 0 && (
              <div>
                <p className="font-display text-acid-yellow text-[10px] tracking-widest mb-2">/ LINEUP</p>
                <div className="flex flex-wrap gap-2">
                  {lineup.map((artist) => (
                    <span
                      key={artist}
                      className={`font-display text-xs px-3 py-1.5 border-2 ${
                        artist.toUpperCase() === "TBA"
                          ? "border-cream/20 text-cream/40 border-dashed"
                          : "border-cream/40 text-cream"
                      }`}
                    >
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Countdown */}
            {!cd.over && (
              <div className="bg-cream/5 border-2 border-cream/10 px-4 py-3 inline-flex items-center gap-4">
                <p className="font-display text-acid-yellow text-[10px] tracking-widest">DOORS IN</p>
                <div className="flex gap-2 font-display text-cream">
                  {cd.days > 0 && <><span className="text-xl tabular-nums">{cd.days}</span><span className="text-xs opacity-50 self-end mb-0.5">D</span></>}
                  <span className="text-xl tabular-nums">{Pad(cd.hours)}</span><span className="text-xs opacity-50 self-end mb-0.5">H</span>
                  <span className="text-xl tabular-nums">{Pad(cd.mins)}</span><span className="text-xs opacity-50 self-end mb-0.5">M</span>
                  <span className="text-xl tabular-nums">{Pad(cd.secs)}</span><span className="text-xs opacity-50 self-end mb-0.5">S</span>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={`/events/${event.slug}`}
                className="bg-acid-yellow text-ink font-display text-lg px-7 py-3.5 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
              >
                VIEW EVENT & RSVP →
              </Link>
              <Link
                to="/events"
                className="bg-cream/10 text-cream font-display text-base px-5 py-3.5 border-4 border-cream/30 hover:border-cream hover:bg-cream/20 transition-colors"
              >
                ALL EVENTS
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NextEventHero;
