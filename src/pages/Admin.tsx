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


// ── Events Tab ────────────────────────────────────────────────────────────────
function EventsTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from("events").select("*").order("sort_order");
    setEvents((data as Event[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    fetchEvents();
  };

  if (loading) return <p className="p-4 text-ink/60">Loading events...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-ink">Events ({events.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b-4 border-ink text-left">
            <th className="font-display p-2">Title</th>
            <th className="font-display p-2">Date</th>
            <th className="font-display p-2">City</th>
            <th className="font-display p-2">Status</th>
            <th className="font-display p-2"></th>
          </tr></thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id ?? ev.slug} className="border-b border-ink/10">
                <td className="p-2 font-medium">{ev.title}</td>
                <td className="p-2">{ev.date}</td>
                <td className="p-2">{ev.city}</td>
                <td className="p-2"><span className={`px-2 py-0.5 text-xs font-bold border-2 border-ink ${ev.status === "upcoming" ? "bg-acid-yellow text-ink" : "bg-ink/10 text-ink/60"}`}>{ev.status}</span></td>
                <td className="p-2"><button onClick={() => deleteEvent(ev.id!)} className="text-magenta font-display text-xs hover:underline">DELETE</button></td>
              </tr>
            ))}
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
            <TabsTrigger value="videos" className="font-display text-sm text-cream data-[state=active]:bg-acid-yellow data-[state=active]:text-ink px-4 py-2">Videos</TabsTrigger>
          </TabsList>
          <TabsContent value="events"><EventsTab /></TabsContent>
          <TabsContent value="rsvps"><RsvpsTab /></TabsContent>
          <TabsContent value="videos"><VideosTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
