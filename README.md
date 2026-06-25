# CCD — Cats Can Dance

> India's underground electronic music collective. Events, streetwear, culture.

**Live:** [catscandance.com](https://catscandance.com)  
**Stack:** Next.js 14 (Pages Router) · Supabase · Tailwind CSS · Framer Motion · Lenis · Shopify

---

## Architecture

```
Browser (React)
  │
  ├─ Public pages ──→ Supabase (anon key, RLS-protected)
  │                    • events: SELECT ✅
  │                    • site_videos: SELECT ✅
  │                    • event_rsvps: INSERT ✅
  │                    • contact_messages: INSERT ✅
  │                    • early_access_signups: INSERT ✅
  │
  ├─ Admin panel ───→ Supabase Auth (email + password)
  │                    • JWT carries app_metadata.role = "admin"
  │                    • RLS grants full access to admin role
  │                    • Zero API routes, zero exposed keys
  │
  └─ SSG/ISR ───────→ Supabase (service key, server-only)
                       • getStaticProps fetches events at build time
                       • ISR revalidates every 60s
                       • Falls back to src/content/events.ts when Supabase unavailable
```

### Key Principles
- **No proxy, no shim, no middleman** — components talk directly to Supabase
- **RLS enforces everything** — even if client code is tampered with, the database blocks unauthorized access
- **Static fallback** — site renders fully from `src/content/events.ts` even without Supabase connection
- **Zero secrets in browser** — only the anon key (safe by design) reaches the client

---

## What's Live Now

### Public Pages
| Route | Page | Status |
|-------|------|--------|
| `/` | Homepage — next event poster, countdown, about, videos, playlist, drops, contact | ✅ |
| `/events` | Events listing (all events) | ✅ |
| `/events/[slug]` | Event detail — lineup, schedule, venue, RSVP, pet zone, media | ✅ |
| `/ccdxsocial` | 4-city national tour landing (BLR → Mumbai → Hyderabad → Delhi) | ✅ |
| `/ccdxsocial/sponsor` | Sponsorship tiers + inquiry | ✅ |
| `/ccdxsocial/proposal` | B2B proposal page | ✅ |
| `/for-artists` | For Artists page | ✅ |
| `/for-venues` | For Venues page | ✅ |
| `/for-investors` | For Investors page | ✅ |
| `/videos` | Video gallery (YouTube embeds from Supabase) | ✅ |
| `/playlists` | Curated playlists (Spotify/SoundCloud/YouTube) | ✅ |
| `/shop` | Merch store (Shopify Storefront API) | ✅ |
| `/admin` | CMS — events, RSVPs, videos (Supabase Auth) | ✅ |
| `/reset-password` | Password recovery handler | ✅ |

### Working Features
- **RSVP** — direct Supabase insert, RLS-protected
- **Contact form** — direct Supabase insert
- **Early access signups** — with duplicate detection (unique constraint)
- **Event countdown** — live timer on event pages + CCDxSocial
- **Shop** — Shopify Storefront API with cart (Zustand + localStorage)
- **Smooth scroll** — Lenis v1.x at app level
- **Admin** — email/password sign-in + magic link option, RLS-enforced
- **ISR** — event detail pages revalidate every 60s
- **SEO** — JSON-LD schema, Open Graph, structured data on every page

---

## What Needs to Be Built (Future Roadmap)

### Priority 1 — Immediate
| Feature | Where | Notes |
|---------|-------|-------|
| Individual city event pages | `/events/ccdxsocial-blr`, `-mum`, `-hyd` | Static content exists in `src/content/events.ts`, just needs the slug data updated to match the 4-city format |
| Admin event editor | `src/pages/Admin.tsx` → EventsTab | Currently shows list + delete. Needs add/edit form with all fields |
| Email confirmations | Supabase Edge Function or Resend | Send RSVP confirmation email after insert (use database webhook → edge function) |

### Priority 2 — Growth
| Feature | Architecture | Notes |
|---------|-------------|-------|
| Blog / Journal | New table `blog_posts` + `pages/blog/[slug].tsx` | SSG with ISR. Admin tab to manage. Markdown or rich text. |
| Artists directory | New table `artists` + `pages/artists/index.tsx` + `[slug].tsx` | RLS: public read, admin write. Old code exists in `.migration-backup` for reference. |
| Promoter portal | Supabase Auth role `promoter` + new pages | Submit events, manage listings. RLS policy: `role IN ('admin', 'promoter')` |
| Ticketing / Paid events | Razorpay or Stripe integration | Add `ticket_tiers` table, checkout flow, QR generation |
| Email marketing | Resend or Loops integration | Triggered by signups, RSVPs. Supabase webhooks → edge function |
| Instagram feed | Behold.so proxy or direct Meta API | Old proxy code existed. Create Supabase edge function to cache feed. |

### Priority 3 — Scale
| Feature | Architecture | Notes |
|---------|-------------|-------|
| Multi-city expansion | `cities` table, city-specific pages | RLS scoping by city for regional promoters |
| User accounts | Supabase Auth for public users | Save events, follow artists, earn XP. Old schema exists in backup. |
| Artist booking marketplace | `booking_requests` table + messaging | Old schema + code in `.migration-backup`. Full implementation ready to port. |
| Analytics dashboard | Supabase views + Recharts | RSVP trends, signup growth, event performance |
| CMS rich text editor | TipTap or Plate | For blog posts, event descriptions |
| Image uploads | Supabase Storage | Event posters, artist photos. Storage bucket + RLS. |
| Push notifications | Web Push API + Supabase | Event reminders, lineup drops |

---

## How It Scales

### Adding a new feature (example: Blog)

1. **Create table:**
```sql
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  excerpt TEXT,
  cover_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published" ON blog_posts
  FOR SELECT USING (published = true);
CREATE POLICY "Admin manages posts" ON blog_posts
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
```

2. **Create page:** `pages/blog/[slug].tsx` with `getStaticProps` (ISR)
3. **Create hook:** `src/hooks/usePosts.ts` — fetches from Supabase with static fallback
4. **Add admin tab:** New component in `src/pages/Admin.tsx`
5. **Done.** RLS handles security. No API routes needed.

### Adding a new role (example: Promoter)

1. Grant role: `UPDATE auth.users SET raw_app_meta_data = ... || '{"role":"promoter"}'`
2. Add RLS policy: `FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'promoter'))`
3. Create promoter pages that use the same `supabase` client
4. RLS enforces access — no code changes to existing features

---

## Project Structure

```
├── pages/                    # Next.js Pages Router
│   ├── _app.tsx             # App wrapper (React Query, Lenis, Theme, Disco)
│   ├── _document.tsx        # HTML shell (SEO meta, fonts, structured data)
│   ├── index.tsx            # → src/pages/Index.tsx
│   ├── events/
│   │   ├── index.tsx        # → src/pages/Events.tsx
│   │   └── [slug].tsx       # ISR event detail (getStaticProps + fallback)
│   ├── ccdxsocial/
│   │   ├── index.tsx        # → src/pages/CcdxSocialSeries.tsx (4-city tour)
│   │   ├── sponsor.tsx      # → src/pages/CcdxSocialSponsor.tsx
│   │   └── proposal.tsx     # → src/pages/CcdxSocial.tsx
│   ├── admin.tsx            # → src/pages/Admin.tsx (dynamic, no SSR)
│   ├── reset-password.tsx   # Password recovery handler
│   └── api/
│       ├── health.ts        # Health check
│       └── revalidate.ts    # On-demand ISR trigger
│
├── src/
│   ├── lib/
│   │   ├── supabase.ts      # Browser client (anon key, safe proxy when unconfigured)
│   │   ├── supabase-server.ts # Server client (service key, for getStaticProps)
│   │   ├── shopify.ts       # Shopify Storefront API client
│   │   ├── utils.ts         # cn() helper
│   │   ├── img.ts           # Static image URL resolver
│   │   └── parse-date.ts    # Date parsing utilities
│   │
│   ├── hooks/
│   │   ├── useEvents.ts     # Fetch events (React Query + Supabase + static fallback)
│   │   ├── useRsvp.ts       # Submit RSVP (mutation)
│   │   ├── useContact.ts    # Submit contact (mutation)
│   │   ├── useEarlyAccess.ts # Submit email signup (mutation)
│   │   └── useSmoothScroll.ts # Deprecated no-op (scroll is app-level now)
│   │
│   ├── content/
│   │   └── events.ts        # Static event data (fallback when Supabase unavailable)
│   │
│   ├── components/
│   │   ├── SmoothScroll.tsx  # Lenis v1.x ReactLenis wrapper
│   │   ├── Nav.tsx           # Site navigation
│   │   ├── Hero.tsx          # Homepage hero (parallax cats)
│   │   ├── RsvpDialog.tsx    # RSVP form modal
│   │   ├── SectionReveal.tsx # Viewport fade-in animation
│   │   └── ui/              # shadcn/ui components
│   │
│   ├── pages/               # Actual page implementations
│   │   ├── Index.tsx         # Homepage
│   │   ├── Events.tsx        # Events listing
│   │   ├── EventDetail.tsx   # Single event showcase
│   │   ├── CcdxSocialSeries.tsx # 4-city tour page
│   │   ├── Admin.tsx         # CMS (Supabase Auth + RLS)
│   │   └── ...
│   │
│   └── stores/
│       └── cartStore.ts      # Zustand cart (Shopify integration)
│
├── public/
│   ├── supabase-seed.sql    # Database schema + RLS + seed data
│   └── ...                  # Favicons, manifests, PDFs, audio
│
├── netlify.toml             # Netlify build config
├── next.config.mjs          # Next.js config
├── tailwind.config.ts       # Tailwind + custom theme
└── .env.example             # Required environment variables
```

---

## Environment Variables

| Variable | Where | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Netlify + local | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Netlify + local | ✅ | Public anon key (safe to expose) |
| `SUPABASE_SERVICE_KEY` | Netlify only | ✅ | Server-side only (ISR, never in browser) |
| `NEXT_PUBLIC_SITE_URL` | Netlify | ⚡ | For magic link redirects |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Netlify | Optional | Shopify store (shop page) |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | Netlify | Optional | Shopify access token |
| `REVALIDATE_SECRET` | Netlify | Optional | Protects ISR revalidation endpoint |

---

## Setup Guide

### 1. Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → paste contents of `public/supabase-seed.sql` → Run
3. Go to Authentication → Users → "Add user" (your email + password)
4. Grant admin role in SQL Editor:
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
   WHERE email = 'your@email.com';
   ```
5. Go to Authentication → URL Configuration:
   - Set **Site URL** to your Netlify domain
   - Add `https://your-site.netlify.app/reset-password` to **Redirect URLs**
   - Add `https://your-site.netlify.app/admin` to **Redirect URLs**

### 2. Netlify
1. Connect this repo
2. Set environment variables (see table above)
3. Deploy — `netlify.toml` handles build config automatically

### 3. Shopify (optional)
1. Create a Storefront API access token in your Shopify admin
2. Set `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` and `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`
3. Shop page will go live automatically

---

## For the Next Developer / AI Agent

### What you're working with:
- **Clean Supabase integration** — no shims, no proxies. Direct client calls everywhere.
- **RLS is the auth layer** — don't create API routes for CRUD. Just add tables + policies.
- **Static fallback pattern** — every data hook falls back to `src/content/` when Supabase is unreachable.
- **Lenis scroll** — app-level, don't add per-page scroll libraries.
- **The old codebase** is in the `CCD-Final-Next.Js` repo under `.migration-backup/` — reference it for feature implementations (artists, blog, ticketing, promoters) but don't copy the architecture (proxy/shim pattern is dead).

### When adding features:
1. Create the Supabase table with RLS policies
2. Create a hook in `src/hooks/` that fetches with static fallback
3. Create the page/component that uses the hook
4. Add admin tab if needed (same Supabase client, RLS handles auth)
5. No API routes unless you need server-side secrets (email sending, webhooks)

### Don't:
- Don't add API routes for database CRUD (RLS handles it)
- Don't expose service keys to the browser
- Don't add auth libraries (Supabase Auth is sufficient)
- Don't add smooth scroll libraries (Lenis is at app level)
- Don't fetch from `/api/` for data reads (use Supabase client directly)

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (Pages Router) | SSG + ISR for SEO, proven stability |
| Database | Supabase (PostgreSQL + RLS) | Auth + DB + Storage in one, RLS is the security layer |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, consistent design system |
| Animations | Framer Motion | Viewport reveals, parallax, page transitions |
| Scroll | Lenis v1.x | ~3KB, smooth momentum, works with Framer Motion |
| State | React Query (server) + Zustand (client) | Caching + mutations / cart state |
| Forms | Zod validation + native forms | Lightweight, no form library overhead |
| Shop | Shopify Storefront API | Headless commerce, managed inventory |
| Deploy | Netlify (or Vercel) | Edge CDN, automatic deploys |

---

## Migration Reference

The original full-featured codebase lives at `paramminhas5/CCD-Final-Next.Js` under `.migration-backup/artifacts/cats-can-dance/`. It contains:

- Full artist directory + EPK generator
- Blog system with markdown
- Promoter portal with event submission
- Ticketing system (Razorpay)
- Booking marketplace with messaging
- Fan XP/gamification system
- Instagram feed integration
- AI poster generation (fal.ai)
- Knowledge graph (artist connections)

All of these can be rebuilt using the clean architecture described above. The data models and UI components are there for reference — just wire them to direct Supabase instead of the old proxy pattern.

---

Built by Cats Can Dance · Bengaluru, India
