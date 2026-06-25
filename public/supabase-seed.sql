-- ============================================================================
-- CCD Supabase Schema — Run this in your Supabase SQL Editor
-- Creates all tables + RLS policies for the CCD platform.
-- ============================================================================

-- ── Events ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT,
  city TEXT,
  venue TEXT,
  blurb TEXT,
  lineup TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'upcoming',
  poster_url TEXT,
  sort_order INT DEFAULT 0,
  series TEXT,
  series_label TEXT,
  event_type TEXT,
  pet_friendly BOOLEAN DEFAULT false,
  series_tagline TEXT,
  is_finale BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read events" ON events FOR SELECT USING (true);
CREATE POLICY "Service key manages events" ON events FOR ALL USING (auth.role() = 'service_role');

-- ── Event RSVPs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  plus_ones INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can RSVP" ON event_rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Service key reads RSVPs" ON event_rsvps FOR SELECT USING (auth.role() = 'service_role');

-- ── Contact Messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Service key reads messages" ON contact_messages FOR SELECT USING (auth.role() = 'service_role');

-- ── Early Access Signups ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS early_access_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'home',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can sign up" ON early_access_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Service key reads signups" ON early_access_signups FOR SELECT USING (auth.role() = 'service_role');

-- ── Site Videos ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_id TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read videos" ON site_videos FOR SELECT USING (true);
CREATE POLICY "Service key manages videos" ON site_videos FOR ALL USING (auth.role() = 'service_role');

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — CCD×SOCIAL Tour Events
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO events (slug, title, date, city, venue, blurb, lineup, status, poster_url, sort_order, series, series_label, event_type, pet_friendly, series_tagline) VALUES
('ccdxsocial-blr', 'CCDXSOCIAL 01', 'Sun, Jun 28, 2026', 'Bangalore', 'Social, Indiranagar',
 'India''s first curated pet lifestyle festival meets underground dance music. Outdoor pet zone from 4 PM. Dance floor opens at 8.',
 ARRAY['Startdawg', 'Merman', 'TBA'], 'upcoming',
 'https://catscandance.com/__l5e/assets-v1/4ec50939-9498-4ff9-b642-2a095db54775/ccdxsocial-blr-poster.jpg',
 1, 'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true, 'BROAD · WELCOMING · FIRST IMPRESSION'),

('ccdxsocial-mum', 'CCDXSOCIAL 02', 'Sun, Jul 26, 2026', 'Mumbai', 'Antisocial, Khar',
 'Mumbai brings the looks. Best-dressed contest, live grooming demo, portrait studio. Tansane · Merman · Taco on the floor.',
 ARRAY['Tansane', 'Merman', 'Taco'], 'upcoming',
 'https://catscandance.com/__l5e/assets-v1/c77b5b48-b34f-4add-a877-c1fd3caad34f/ccdxsocial-mum-poster.jpg',
 2, 'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true, 'STYLE · FASHION · MIDSUMMER ENERGY'),

('ccdxsocial-hyd', 'CCDXSOCIAL 03', 'Sun, Aug 30, 2026', 'Hyderabad', 'Social Mindspace, Hyderabad',
 'The most physical edition. Two agility courses, timed speed runs, performance contest. Hyderabad''s underground takes the late slot.',
 ARRAY['TBA'], 'upcoming',
 'https://catscandance.com/__l5e/assets-v1/02bd78b3-7f87-43df-a548-c2148faf8a02/ccdxsocial-hyd-poster.jpg',
 3, 'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true, 'AGILITY · PERFORMANCE · PRE-FINALE'),

('ccdxsocial-delhi', 'CCDXSOCIAL MEGA', 'October 2026', 'Delhi / NCR', 'Venue TBA — large format',
 'Everything the tour has been building toward. Outdoor stage, pet runway, agility finals, full lineup.',
 ARRAY['TBA'], 'upcoming',
 NULL,
 4, 'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true, 'GRAND FINALE · SEASON CLOSER')

ON CONFLICT (slug) DO NOTHING;
