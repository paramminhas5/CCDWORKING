/**
 * Admin CMS — Password-gated, direct Supabase admin client.
 * 
 * Tabs: Events, RSVPs, Videos, Settings
 * 
 * Scalable: add more tabs as features grow (artists, blog, promoters, etc.)
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADMIN_PASSWORD = "84838281"; // default — override via env

// ── Admin Supabase client (service key, set after auth) ──────────────────────
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}


// ── Types ─────────────────────────────────────────────────────────────────────
interface Event {
  id?: string;
  slug: string;
  title: string;
  date: string;
  city: string;
  venue: string;
  blurb: string;
  lineup: string[];
  status: string;
  poster_url: string | null;
  sort_order: number;
  series: string | null;
  series_label: string | null;
  event_type: string | null;
  pet_friendly: boolean;
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
  is_featured: boolean;
  sort_order: number;
}

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <form onSubmit={(e) => { e.preventDefault(); if (pw === ADMIN_PASSWORD) onAuth(); else toast.error("Wrong password"); }}
        className="bg-cream border-4 border-ink chunk-shadow p-8 max-w-sm w-full">
        <h1 className="font-display text-3xl text-ink mb-4">CCD ADMIN</h1>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password"
          className="w-full border-4 border-ink px-4 py-3 font-medium mb-4 focus:outline-none focus:bg-acid-yellow" autoFocus />
        <button type="submit" className="w-full bg-magenta text-cream font-display text-lg py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
          ENTER →
        </button>
      </form>
    </div>
  );
}


// ── Events Tab ────────────────────────────────────────────────────────────────
function EventsTab({ supabase }: { supabase: any }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from("events").select("*").order("sort_order");
    setEvents(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Deleted");
    fetchEvents();
  };

  if (loading) return <p className="p-4 text-ink/60">Loading events...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">Events ({events.length})</h2>
        <button onClick={() => toast.info("Event editor coming soon — use Supabase dashboard for now")}
          className="bg-acid-yellow text-ink font-display text-sm px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
          + ADD EVENT
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-4 border-ink text-left">
              <th className="font-display p-2">Title</th>
              <th className="font-display p-2">Date</th>
              <th className="font-display p-2">City</th>
              <th className="font-display p-2">Status</th>
              <th className="font-display p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id ?? ev.slug} className="border-b border-ink/10">
                <td className="p-2 font-medium">{ev.title}</td>
                <td className="p-2">{ev.date}</td>
                <td className="p-2">{ev.city}</td>
                <td className="p-2">
                  <span className={`inline-block px-2 py-0.5 text-xs font-bold border-2 border-ink ${ev.status === "upcoming" ? "bg-acid-yellow text-ink" : "bg-ink/10 text-ink/60"}`}>
                    {ev.status}
                  </span>
                </td>
                <td className="p-2">
                  <button onClick={() => deleteEvent(ev.id!)} className="text-magenta font-display text-xs hover:underline">DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ── RSVPs Tab ─────────────────────────────────────────────────────────────────
function RsvpsTab({ supabase }: { supabase: any }) {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchRsvps = useCallback(async () => {
    const { data } = await supabase.from("event_rsvps").select("*").order("created_at", { ascending: false });
    setRsvps(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchRsvps(); }, [fetchRsvps]);

  const filtered = filter ? rsvps.filter((r) => r.event_slug === filter) : rsvps;
  const slugs = [...new Set(rsvps.map((r) => r.event_slug))];

  const exportCsv = () => {
    const header = "Name,Email,Plus Ones,Event,Date\n";
    const rows = filtered.map((r) => `"${r.name}","${r.email}",${r.plus_ones},"${r.event_slug}","${r.created_at}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `rsvps-${filter || "all"}.csv`; a.click();
    URL.revokeObjectURL(url);
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
          <button onClick={exportCsv} className="bg-ink text-cream font-display text-sm px-4 py-2 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
            EXPORT CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-4 border-ink text-left">
              <th className="font-display p-2">Name</th>
              <th className="font-display p-2">Email</th>
              <th className="font-display p-2">+</th>
              <th className="font-display p-2">Event</th>
              <th className="font-display p-2">When</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-ink/10">
                <td className="p-2 font-medium">{r.name}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.plus_ones}</td>
                <td className="p-2 text-xs">{r.event_slug}</td>
                <td className="p-2 text-xs text-ink/60">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ── Videos Tab ────────────────────────────────────────────────────────────────
function VideosTab({ supabase }: { supabase: any }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");

  const fetchVideos = useCallback(async () => {
    const { data } = await supabase.from("site_videos").select("*").order("sort_order");
    setVideos(data ?? []);
    setLoading(false);
  }, [supabase]);

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {videos.map((v) => (
          <div key={v.id ?? v.youtube_id} className="border-4 border-ink chunk-shadow bg-cream relative group">
            <img src={v.thumbnail_url} alt={v.title} className="w-full aspect-video object-cover" />
            <div className="p-2">
              <p className="font-display text-xs truncate">{v.title}</p>
            </div>
            <button onClick={() => deleteVideo(v.id!)} className="absolute top-1 right-1 bg-magenta text-cream font-display text-[10px] px-2 py-0.5 border-2 border-ink opacity-0 group-hover:opacity-100 transition-opacity">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Main Admin Component ──────────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  useEffect(() => {
    if (authed) {
      const client = getAdminClient();
      if (!client) {
        toast.error("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.");
      }
      setSupabaseClient(client);
    }
  }, [authed]);

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  if (!supabaseClient) {
    return (
      <div className="min-h-screen bg-cream p-8">
        <h1 className="font-display text-3xl text-ink mb-4">Admin</h1>
        <div className="bg-acid-yellow border-4 border-ink p-6 max-w-lg">
          <p className="font-display text-lg text-ink mb-2">Supabase not configured</p>
          <p className="text-ink/70 text-sm">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_SERVICE_KEY</code> in your environment variables to enable the admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-ink border-b-4 border-ink px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-cream">CCD ADMIN</h1>
        <a href="/" className="font-display text-sm text-acid-yellow hover:text-cream transition-colors">← BACK TO SITE</a>
      </header>

      <div className="container py-8">
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="bg-ink border-4 border-ink mb-6 p-1 flex gap-1">
            <TabsTrigger value="events" className="font-display text-sm text-cream data-[state=active]:bg-acid-yellow data-[state=active]:text-ink px-4 py-2">Events</TabsTrigger>
            <TabsTrigger value="rsvps" className="font-display text-sm text-cream data-[state=active]:bg-acid-yellow data-[state=active]:text-ink px-4 py-2">RSVPs</TabsTrigger>
            <TabsTrigger value="videos" className="font-display text-sm text-cream data-[state=active]:bg-acid-yellow data-[state=active]:text-ink px-4 py-2">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="events"><EventsTab supabase={supabaseClient} /></TabsContent>
          <TabsContent value="rsvps"><RsvpsTab supabase={supabaseClient} /></TabsContent>
          <TabsContent value="videos"><VideosTab supabase={supabaseClient} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
