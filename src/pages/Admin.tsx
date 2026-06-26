/**
 * Admin CMS — Supabase Auth (email+password primary, magic link fallback).
 * 
 * Flow:
 * 1. Not signed in → show sign-in form (email + password, or magic link)
 * 2. Signed in but not admin → show "not authorized"
 * 3. Signed in as admin → show CMS tabs
 * 
 * RLS policies enforce access at the database level.
 * Password lives in Supabase Auth — not in env vars or client code.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { uploadPoster } from "@/lib/upload";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@supabase/supabase-js";


// ── Types ─────────────────────────────────────────────────────────────────────
interface Event {
  id?: string;
  slug: string;
  title: string;
  date: string;
  city: string;
  venue: string;
  status: string;
  poster_url: string | null;
  sort_order: number;
}

interface Rsvp {
  id: string;
  event_slug: string;
  name: string;
  email: string;
  plus_ones: number;
  created_at: string;
}

interface Video {
  id?: string;
  youtube_id: string;
  title: string;
  thumbnail_url: string;
  sort_order: number;
}

interface ContactMessage {
  id: string;
  body: {
    name?: string;
    email?: string;
    message?: string;
    kind?: string;
    reason?: string;
    phone?: string;
  };
  created_at: string;
}


// ── Auth Gate ─────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) onAuth(user);
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) onAuth(session.user);
    });
    return () => subscription.unsubscribe();
  }, [onAuth]);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      onAuth(data.user);
    }
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${siteUrl}/admin` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setMagicSent(true);
      toast.success("Check your email for the sign-in link");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="font-display text-cream text-lg animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="bg-cream border-4 border-ink chunk-shadow p-8 max-w-sm w-full">
        <h1 className="font-display text-3xl text-ink mb-2">CCD ADMIN</h1>
        <p className="text-ink/60 text-sm mb-6">Sign in to access the CMS.</p>

        {magicSent ? (
          <div className="text-center py-4">
            <p className="font-display text-2xl text-magenta mb-2">CHECK YOUR EMAIL</p>
            <p className="text-ink/70 text-sm">
              Sign-in link sent to <strong>{email}</strong>.
            </p>
            <button onClick={() => setMagicSent(false)} className="mt-4 font-display text-sm text-magenta underline">
              Try again
            </button>
          </div>
        ) : mode === "password" ? (
          <form onSubmit={signInWithPassword}>
            <label className="font-display text-sm text-ink mb-1 block">EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
              className="w-full border-4 border-ink px-4 py-3 font-medium mb-3 focus:outline-none focus:bg-acid-yellow" />
            <label className="font-display text-sm text-ink mb-1 block">PASSWORD</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full border-4 border-ink px-4 py-3 font-medium mb-4 focus:outline-none focus:bg-acid-yellow" />
            <button type="submit" disabled={loading}
              className="w-full bg-magenta text-cream font-display text-lg py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60">
              {loading ? "SIGNING IN..." : "SIGN IN →"}
            </button>
            <button type="button" onClick={() => setMode("magic")} className="mt-3 w-full text-center font-display text-xs text-ink/50 hover:text-magenta">
              Use magic link instead
            </button>
          </form>
        ) : (
          <form onSubmit={sendMagicLink}>
            <label className="font-display text-sm text-ink mb-1 block">EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
              className="w-full border-4 border-ink px-4 py-3 font-medium mb-4 focus:outline-none focus:bg-acid-yellow" />
            <button type="submit" disabled={loading}
              className="w-full bg-magenta text-cream font-display text-lg py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60">
              {loading ? "SENDING..." : "SEND MAGIC LINK →"}
            </button>
            <button type="button" onClick={() => setMode("password")} className="mt-3 w-full text-center font-display text-xs text-ink/50 hover:text-magenta">
              Use password instead
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


// ── Not Authorized ────────────────────────────────────────────────────────────
function NotAuthorized({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-acid-yellow border-4 border-ink chunk-shadow p-8 max-w-md text-center">
        <p className="font-display text-3xl text-ink mb-3">NOT AUTHORIZED</p>
        <p className="text-ink/70 text-sm mb-4">
          Signed in as <strong>{user.email}</strong> but this account doesn&apos;t have admin access.
        </p>
        <p className="text-ink/50 text-xs mb-6">
          Grant admin: run in Supabase SQL Editor:<br />
          <code className="bg-ink/10 px-2 py-1 text-[10px] mt-1 inline-block">
            UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || {`'{"role":"admin"}'`}::jsonb WHERE email = &apos;{user.email}&apos;;
          </code>
        </p>
        <button onClick={() => supabase.auth.signOut()} className="bg-ink text-cream font-display text-sm px-6 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
          SIGN OUT
        </button>
      </div>
    </div>
  );
}


// ── Add Event Form ────────────────────────────────────────────────────────────
const EMPTY_EVENT_FORM = {
  slug: "",
  title: "",
  date: "",
  city: "Bangalore",
  venue: "",
  blurb: "",
  lineup: "",
  status: "upcoming" as "upcoming" | "past",
  poster_url: "",
  sort_order: 99,
  series: "",
  series_label: "",
  event_type: "standard",
  pet_friendly: false,
  series_tagline: "",
  is_finale: false,
};

function AddEventForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState(EMPTY_EVENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    updateField("title", title);
    if (!form.slug || form.slug === slugify(form.title)) {
      updateField("slug", slugify(title));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      date: form.date.trim(),
      city: form.city.trim(),
      venue: form.venue.trim(),
      blurb: form.blurb.trim() || "",
      lineup: form.lineup.split(",").map((s) => s.trim()).filter(Boolean),
      status: form.status,
      poster_url: form.poster_url.trim() || null,
      sort_order: form.sort_order,
      series: form.series.trim() || null,
      series_label: form.series_label.trim() || null,
      event_type: form.event_type || "standard",
      pet_friendly: form.pet_friendly,
      series_tagline: form.series_tagline.trim() || null,
      is_finale: form.is_finale,
    };

    const { error } = await supabase.from("events").insert(payload);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Event "${form.title}" created!`);
      setForm(EMPTY_EVENT_FORM);
      setExpanded(false);
      onSuccess();
    }

    setSubmitting(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="bg-acid-yellow text-ink font-display text-sm px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
      >
        + ADD EVENT
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-cream border-4 border-ink chunk-shadow p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-xl text-ink">NEW EVENT</h3>
        <button type="button" onClick={() => setExpanded(false)} className="font-display text-xs text-ink/50 hover:text-magenta">
          CANCEL
        </button>
      </div>

      {/* Row 1: Title + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-display text-xs text-ink mb-1 block">TITLE *</label>
          <input
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="CCDXSOCIAL 04"
            required
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
          />
        </div>
        <div>
          <label className="font-display text-xs text-ink mb-1 block">SLUG *</label>
          <input
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="ccdxsocial-04"
            required
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow font-mono"
          />
          <p className="text-[10px] text-ink/40 mt-0.5">URL: /events/{form.slug || "..."}</p>
        </div>
      </div>

      {/* Row 2: Date + City + Venue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-display text-xs text-ink mb-1 block">DATE *</label>
          <input
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            placeholder="Sun, Jun 29, 2026"
            required
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
          />
        </div>
        <div>
          <label className="font-display text-xs text-ink mb-1 block">CITY *</label>
          <input
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Bangalore"
            required
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
          />
        </div>
        <div>
          <label className="font-display text-xs text-ink mb-1 block">VENUE *</label>
          <input
            value={form.venue}
            onChange={(e) => updateField("venue", e.target.value)}
            placeholder="Indiranagar Social"
            required
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
          />
        </div>
      </div>

      {/* Row 3: Status + Sort Order */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-display text-xs text-ink mb-1 block">STATUS *</label>
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="w-full border-4 border-ink px-3 py-2 font-display text-sm bg-cream"
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
        <div>
          <label className="font-display text-xs text-ink mb-1 block">SORT ORDER</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => updateField("sort_order", parseInt(e.target.value) || 0)}
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
          />
        </div>
        <div>
          <label className="font-display text-xs text-ink mb-1 block">EVENT TYPE</label>
          <select
            value={form.event_type}
            onChange={(e) => updateField("event_type", e.target.value)}
            className="w-full border-4 border-ink px-3 py-2 font-display text-sm bg-cream"
          >
            <option value="standard">Standard</option>
            <option value="ccdxsocial">CCD x Social</option>
          </select>
        </div>
      </div>

      {/* Row 4: Blurb */}
      <div>
        <label className="font-display text-xs text-ink mb-1 block">BLURB</label>
        <textarea
          value={form.blurb}
          onChange={(e) => updateField("blurb", e.target.value)}
          placeholder="Short description of the event..."
          rows={3}
          className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow resize-y"
        />
      </div>

      {/* Row 5: Lineup + Poster Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-display text-xs text-ink mb-1 block">LINEUP (comma-separated)</label>
          <input
            value={form.lineup}
            onChange={(e) => updateField("lineup", e.target.value)}
            placeholder="Startdawg, Merman, TBA"
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
          />
        </div>
        <div>
          <label className="font-display text-xs text-ink mb-1 block">POSTER</label>
          <PosterUpload
            currentUrl={form.poster_url}
            onUploaded={(url) => updateField("poster_url", url)}
            folder={form.slug || "new"}
          />
        </div>
      </div>

      {/* Row 6: Series fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-display text-xs text-ink mb-1 block">SERIES</label>
          <input
            value={form.series}
            onChange={(e) => updateField("series", e.target.value)}
            placeholder="ccdxsocial"
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
          />
        </div>
        <div>
          <label className="font-display text-xs text-ink mb-1 block">SERIES LABEL</label>
          <input
            value={form.series_label}
            onChange={(e) => updateField("series_label", e.target.value)}
            placeholder="CCD x SOCIAL"
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
          />
        </div>
        <div>
          <label className="font-display text-xs text-ink mb-1 block">SERIES TAGLINE</label>
          <input
            value={form.series_tagline}
            onChange={(e) => updateField("series_tagline", e.target.value)}
            placeholder="BROAD - WELCOMING - FIRST IMPRESSION"
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
          />
        </div>
      </div>

      {/* Row 7: Checkboxes */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.pet_friendly}
            onChange={(e) => updateField("pet_friendly", e.target.checked)}
            className="w-5 h-5 border-4 border-ink accent-magenta"
          />
          <span className="font-display text-xs text-ink">PET FRIENDLY</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_finale}
            onChange={(e) => updateField("is_finale", e.target.checked)}
            className="w-5 h-5 border-4 border-ink accent-magenta"
          />
          <span className="font-display text-xs text-ink">IS FINALE</span>
        </label>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-magenta text-cream font-display text-sm px-8 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60"
        >
          {submitting ? "CREATING..." : "CREATE EVENT →"}
        </button>
      </div>
    </form>
  );
}

// ── Delete Confirmation Dialog ────────────────────────────────────────────────
function DeleteConfirmDialog({
  event,
  onConfirm,
  onCancel,
}: {
  event: Event;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm">
      <div className="bg-cream border-4 border-ink chunk-shadow p-6 max-w-sm w-full mx-4">
        <h3 className="font-display text-xl text-ink mb-2">DELETE EVENT?</h3>
        <p className="text-sm text-ink/70 mb-1">
          This will permanently remove:
        </p>
        <p className="font-display text-sm text-magenta mb-4">
          &quot;{event.title}&quot; — {event.date}
        </p>
        <p className="text-xs text-ink/50 mb-6">
          This action cannot be undone. RSVPs for this event will be orphaned.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-ink/10 text-ink font-display text-sm py-2 border-4 border-ink hover:bg-ink/20 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-magenta text-cream font-display text-sm py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Events Tab ────────────────────────────────────────────────────────────────
function EventsTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from("events").select("*").order("sort_order");
    setEvents((data as Event[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const deleteEvent = async (event: Event) => {
    setDeleteLoading(true);

    const { error } = await supabase.from("events").delete().eq("id", event.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`"${event.title}" deleted`);
      fetchEvents();
    }

    setDeleteLoading(false);
    setDeleting(null);
  };

  if (loading) return <p className="p-4 text-ink/60">Loading events...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-ink">Events ({events.length})</h2>
      </div>

      {/* Add Event Form */}
      <AddEventForm onSuccess={fetchEvents} />

      {/* Events Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b-4 border-ink text-left">
            <th className="font-display p-2">Title</th>
            <th className="font-display p-2">Slug</th>
            <th className="font-display p-2">Date</th>
            <th className="font-display p-2">City</th>
            <th className="font-display p-2">Status</th>
            <th className="font-display p-2">Order</th>
            <th className="font-display p-2"></th>
          </tr></thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id ?? ev.slug} className="border-b border-ink/10 hover:bg-acid-yellow/10 transition-colors">
                <td className="p-2 font-medium">{ev.title}</td>
                <td className="p-2 font-mono text-xs text-ink/60">{ev.slug}</td>
                <td className="p-2">{ev.date}</td>
                <td className="p-2">{ev.city}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 text-xs font-bold border-2 border-ink ${ev.status === "upcoming" ? "bg-acid-yellow text-ink" : "bg-ink/10 text-ink/60"}`}>
                    {ev.status}
                  </span>
                </td>
                <td className="p-2 text-xs text-ink/60">{ev.sort_order}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => setEditing(ev)}
                    className="text-ink font-display text-xs hover:underline"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => setDeleting(ev)}
                    className="text-magenta font-display text-xs hover:underline"
                  >
                    DELETE
                  </button>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink/40 font-display">
                  No events yet. Create your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleting && (
        <DeleteConfirmDialog
          event={deleting}
          onConfirm={() => deleteEvent(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}

      {/* Edit Event Dialog */}
      {editing && (
        <EditEventDialog
          event={editing}
          onSaved={fetchEvents}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/** Convert a title to a URL-safe slug */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}


// ── Poster Upload Component ───────────────────────────────────────────────────
function PosterUpload({
  currentUrl,
  onUploaded,
  folder,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
  folder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"file" | "url">(currentUrl ? "url" : "file");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Max file size: 10MB");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadPoster(file, folder);
      onUploaded(result.url);
      toast.success("Poster uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("file")}
          className={`font-display text-[10px] px-2 py-0.5 border-2 border-ink ${mode === "file" ? "bg-ink text-cream" : "bg-cream text-ink"}`}>
          UPLOAD
        </button>
        <button type="button" onClick={() => setMode("url")}
          className={`font-display text-[10px] px-2 py-0.5 border-2 border-ink ${mode === "url" ? "bg-ink text-cream" : "bg-cream text-ink"}`}>
          PASTE URL
        </button>
      </div>
      {mode === "file" ? (
        <label className="block cursor-pointer">
          <div className={`border-4 border-dashed border-ink/30 px-3 py-3 text-center hover:border-ink/60 transition-colors ${uploading ? "opacity-50" : ""}`}>
            {uploading ? (
              <span className="font-display text-xs text-ink/60 animate-pulse">UPLOADING...</span>
            ) : currentUrl ? (
              <span className="font-display text-xs text-ink/60">✓ Uploaded — click to replace</span>
            ) : (
              <span className="font-display text-xs text-ink/40">Click to upload poster image</span>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      ) : (
        <input
          value={currentUrl}
          onChange={(e) => onUploaded(e.target.value)}
          placeholder="https://..."
          className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow"
        />
      )}
      {currentUrl && (
        <div className="flex items-center gap-2">
          <img src={currentUrl} alt="" className="h-10 w-10 object-cover border-2 border-ink" />
          <span className="text-[10px] text-ink/40 truncate flex-1">{currentUrl}</span>
          <button type="button" onClick={() => onUploaded("")} className="font-display text-[10px] text-magenta hover:underline">CLEAR</button>
        </div>
      )}
    </div>
  );
}


// ── Edit Event Dialog ─────────────────────────────────────────────────────────
function EditEventDialog({
  event,
  onSaved,
  onClose,
}: {
  event: Event;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: event.title,
    date: event.date,
    city: event.city,
    venue: event.venue,
    status: event.status,
    poster_url: event.poster_url || "",
    sort_order: event.sort_order,
    blurb: (event as any).blurb || "",
    lineup: Array.isArray((event as any).lineup) ? (event as any).lineup.join(", ") : "",
    series: (event as any).series || "",
    series_label: (event as any).series_label || "",
    event_type: (event as any).event_type || "standard",
    pet_friendly: (event as any).pet_friendly || false,
    series_tagline: (event as any).series_tagline || "",
    is_finale: (event as any).is_finale || false,
  });
  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      date: form.date.trim(),
      city: form.city.trim(),
      venue: form.venue.trim(),
      status: form.status,
      poster_url: form.poster_url.trim() || null,
      sort_order: form.sort_order,
      blurb: form.blurb.trim() || "",
      lineup: form.lineup.split(",").map((s) => s.trim()).filter(Boolean),
      series: form.series.trim() || null,
      series_label: form.series_label.trim() || null,
      event_type: form.event_type || "standard",
      pet_friendly: form.pet_friendly,
      series_tagline: form.series_tagline.trim() || null,
      is_finale: form.is_finale,
    };

    const { error } = await supabase.from("events").update(payload).eq("id", event.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`"${form.title}" updated!`);
      onSaved();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/60 backdrop-blur-sm overflow-y-auto py-8">
      <form onSubmit={handleSave} className="bg-cream border-4 border-ink chunk-shadow p-6 max-w-2xl w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-ink">EDIT: {event.title}</h3>
          <button type="button" onClick={onClose} className="font-display text-xs text-ink/50 hover:text-magenta">✕ CLOSE</button>
        </div>

        {/* Title + Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="font-display text-xs text-ink mb-1 block">TITLE</label>
            <input value={form.title} onChange={(e) => updateField("title", e.target.value)} required
              className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow" />
          </div>
          <div>
            <label className="font-display text-xs text-ink mb-1 block">STATUS</label>
            <select value={form.status} onChange={(e) => updateField("status", e.target.value)}
              className="w-full border-4 border-ink px-3 py-2 font-display text-sm bg-cream">
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>

        {/* Date + City + Venue */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-display text-xs text-ink mb-1 block">DATE</label>
            <input value={form.date} onChange={(e) => updateField("date", e.target.value)} required
              className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow" />
          </div>
          <div>
            <label className="font-display text-xs text-ink mb-1 block">CITY</label>
            <input value={form.city} onChange={(e) => updateField("city", e.target.value)} required
              className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow" />
          </div>
          <div>
            <label className="font-display text-xs text-ink mb-1 block">VENUE</label>
            <input value={form.venue} onChange={(e) => updateField("venue", e.target.value)} required
              className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow" />
          </div>
        </div>

        {/* Blurb */}
        <div>
          <label className="font-display text-xs text-ink mb-1 block">BLURB</label>
          <textarea value={form.blurb} onChange={(e) => updateField("blurb", e.target.value)} rows={3}
            className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow resize-y" />
        </div>

        {/* Lineup + Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="font-display text-xs text-ink mb-1 block">LINEUP (comma-separated)</label>
            <input value={form.lineup} onChange={(e) => updateField("lineup", e.target.value)}
              className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow" />
          </div>
          <div>
            <label className="font-display text-xs text-ink mb-1 block">SORT ORDER</label>
            <input type="number" value={form.sort_order} onChange={(e) => updateField("sort_order", parseInt(e.target.value) || 0)}
              className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow" />
          </div>
        </div>

        {/* Poster Upload */}
        <div>
          <label className="font-display text-xs text-ink mb-1 block">POSTER</label>
          <PosterUpload
            currentUrl={form.poster_url}
            onUploaded={(url) => updateField("poster_url", url)}
            folder={event.slug}
          />
        </div>

        {/* Series fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-display text-xs text-ink mb-1 block">SERIES</label>
            <input value={form.series} onChange={(e) => updateField("series", e.target.value)}
              className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow" />
          </div>
          <div>
            <label className="font-display text-xs text-ink mb-1 block">SERIES LABEL</label>
            <input value={form.series_label} onChange={(e) => updateField("series_label", e.target.value)}
              className="w-full border-4 border-ink px-3 py-2 font-medium text-sm focus:outline-none focus:bg-acid-yellow" />
          </div>
          <div>
            <label className="font-display text-xs text-ink mb-1 block">EVENT TYPE</label>
            <select value={form.event_type} onChange={(e) => updateField("event_type", e.target.value)}
              className="w-full border-4 border-ink px-3 py-2 font-display text-sm bg-cream">
              <option value="standard">Standard</option>
              <option value="ccdxsocial">CCD x Social</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.pet_friendly} onChange={(e) => updateField("pet_friendly", e.target.checked)}
              className="w-5 h-5 border-4 border-ink accent-magenta" />
            <span className="font-display text-xs text-ink">PET FRIENDLY</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_finale} onChange={(e) => updateField("is_finale", e.target.checked)}
              className="w-5 h-5 border-4 border-ink accent-magenta" />
            <span className="font-display text-xs text-ink">IS FINALE</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-magenta text-cream font-display text-sm px-8 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60">
            {saving ? "SAVING..." : "SAVE CHANGES →"}
          </button>
          <button type="button" onClick={onClose}
            className="bg-ink/10 text-ink font-display text-sm px-6 py-3 border-4 border-ink hover:bg-ink/20 transition-colors">
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}


// ── Contacts Tab ──────────────────────────────────────────────────────────────
function ContactsTab() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setMessages((data as ContactMessage[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    fetchMessages();
  };

  const exportCsv = () => {
    const rows = [
      "Name,Email,Kind,Reason,Message,Date",
      ...messages.map((m) =>
        `"${m.body?.name || ""}","${m.body?.email || ""}","${m.body?.kind || ""}","${m.body?.reason || ""}","${(m.body?.message || "").replace(/"/g, '""')}","${m.created_at}"`
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) return <p className="p-4 text-ink/60">Loading contacts...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-ink">Contact Messages ({messages.length})</h2>
        <button onClick={exportCsv} className="bg-ink text-cream font-display text-sm px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
          EXPORT CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-4 border-ink text-left">
              <th className="font-display p-2">Name</th>
              <th className="font-display p-2">Email</th>
              <th className="font-display p-2">Kind</th>
              <th className="font-display p-2">Reason</th>
              <th className="font-display p-2 max-w-[200px]">Message</th>
              <th className="font-display p-2">Date</th>
              <th className="font-display p-2"></th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} className="border-b border-ink/10 hover:bg-acid-yellow/10 transition-colors">
                <td className="p-2 font-medium">{m.body?.name || "—"}</td>
                <td className="p-2 text-xs">{m.body?.email || "—"}</td>
                <td className="p-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold border-2 border-ink bg-acid-yellow/30">
                    {m.body?.kind || "general"}
                  </span>
                </td>
                <td className="p-2 text-xs text-ink/70">{m.body?.reason || "—"}</td>
                <td className="p-2 text-xs text-ink/60 max-w-[200px] truncate" title={m.body?.message}>
                  {m.body?.message || "—"}
                </td>
                <td className="p-2 text-xs text-ink/50">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="p-2">
                  <button onClick={() => deleteMessage(m.id)} className="text-magenta font-display text-xs hover:underline">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink/40 font-display">
                  No contact messages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ── RSVPs Tab ─────────────────────────────────────────────────────────────────
function RsvpsTab() {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchRsvps = useCallback(async () => {
    const { data } = await supabase.from("event_rsvps").select("*").order("created_at", { ascending: false });
    setRsvps((data as Rsvp[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRsvps(); }, [fetchRsvps]);

  const filtered = filter ? rsvps.filter((r) => r.event_slug === filter) : rsvps;
  const slugs = [...new Set(rsvps.map((r) => r.event_slug))];

  const exportCsv = () => {
    const rows = ["Name,Email,Plus Ones,Event,Date", ...filtered.map((r) => `"${r.name}","${r.email}",${r.plus_ones},"${r.event_slug}","${r.created_at}"`)].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rsvps-${filter || "all"}.csv`; a.click();
  };

  if (loading) return <p className="p-4 text-ink/60">Loading RSVPs...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl text-ink">RSVPs ({filtered.length})</h2>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border-4 border-ink px-3 py-2 font-display text-sm bg-cream">
            <option value="">All events</option>
            {slugs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={exportCsv} className="bg-ink text-cream font-display text-sm px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">EXPORT CSV</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b-4 border-ink text-left">
            <th className="font-display p-2">Name</th><th className="font-display p-2">Email</th><th className="font-display p-2">+</th><th className="font-display p-2">Event</th><th className="font-display p-2">When</th>
          </tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-ink/10">
                <td className="p-2 font-medium">{r.name}</td><td className="p-2">{r.email}</td><td className="p-2">{r.plus_ones}</td><td className="p-2 text-xs">{r.event_slug}</td><td className="p-2 text-xs text-ink/60">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ── Videos Tab ────────────────────────────────────────────────────────────────
function VideosTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");

  const fetchVideos = useCallback(async () => {
    const { data } = await supabase.from("site_videos").select("*").order("sort_order");
    setVideos((data as Video[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const id = match?.[1] ?? url.trim();
    if (!id || id.length !== 11) { toast.error("Invalid YouTube URL"); return; }
    const thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    const nextOrder = videos.length ? Math.max(...videos.map((v) => v.sort_order)) + 1 : 0;
    const { error } = await supabase.from("site_videos").insert({ youtube_id: id, title: id, thumbnail_url: thumb, sort_order: nextOrder });
    if (error) { toast.error(error.message); return; }
    toast.success("Video added");
    setUrl("");
    fetchVideos();
  };

  const deleteVideo = async (id: string) => {
    await supabase.from("site_videos").delete().eq("id", id);
    toast.success("Deleted");
    fetchVideos();
  };

  if (loading) return <p className="p-4 text-ink/60">Loading videos...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-ink">Videos ({videos.length})</h2>
      <form onSubmit={addVideo} className="flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube URL or ID" className="flex-1 border-4 border-ink px-4 py-2 font-medium focus:outline-none focus:bg-acid-yellow" />
        <button type="submit" className="bg-acid-yellow text-ink font-display text-sm px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">ADD</button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {videos.map((v) => (
          <div key={v.id ?? v.youtube_id} className="border-4 border-ink chunk-shadow bg-cream relative group">
            <img src={v.thumbnail_url} alt={v.title} className="w-full aspect-video object-cover" />
            <div className="p-2"><p className="font-display text-xs truncate">{v.title}</p></div>
            <button onClick={() => deleteVideo(v.id!)} className="absolute top-1 right-1 bg-magenta text-cream font-display text-[10px] px-2 py-0.5 border-2 border-ink opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Main Admin Component ──────────────────────────────────────────────────────
export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAuth = useCallback((authedUser: User) => {
    setUser(authedUser);
    const role = authedUser.app_metadata?.role;
    setIsAdmin(role === "admin");
  }, []);

  if (!user) return <AuthGate onAuth={handleAuth} />;
  if (!isAdmin) return <NotAuthorized user={user} />;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-ink border-b-4 border-ink px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-cream">CCD ADMIN</h1>
        <div className="flex items-center gap-4">
          <span className="font-display text-xs text-cream/60">{user.email}</span>
          <button onClick={() => supabase.auth.signOut().then(() => { setUser(null); setIsAdmin(false); })} className="font-display text-xs text-acid-yellow hover:text-cream transition-colors">SIGN OUT</button>
          <a href="/" className="font-display text-sm text-acid-yellow hover:text-cream transition-colors">← SITE</a>
        </div>
      </header>
      <div className="container py-8">
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="bg-ink border-4 border-ink mb-6 p-1 flex gap-1 flex-wrap">
            <TabsTrigger value="events" className="font-display text-sm text-cream data-[state=active]:bg-acid-yellow data-[state=active]:text-ink px-4 py-2">Events</TabsTrigger>
            <TabsTrigger value="rsvps" className="font-display text-sm text-cream data-[state=active]:bg-acid-yellow data-[state=active]:text-ink px-4 py-2">RSVPs</TabsTrigger>
            <TabsTrigger value="contacts" className="font-display text-sm text-cream data-[state=active]:bg-acid-yellow data-[state=active]:text-ink px-4 py-2">Contacts</TabsTrigger>
            <TabsTrigger value="videos" className="font-display text-sm text-cream data-[state=active]:bg-acid-yellow data-[state=active]:text-ink px-4 py-2">Videos</TabsTrigger>
          </TabsList>
          <TabsContent value="events"><EventsTab /></TabsContent>
          <TabsContent value="rsvps"><RsvpsTab /></TabsContent>
          <TabsContent value="contacts"><ContactsTab /></TabsContent>
          <TabsContent value="videos"><VideosTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
