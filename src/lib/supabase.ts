/**
 * Supabase browser client — uses the public anon key.
 *
 * This single client handles EVERYTHING:
 * - Public reads (events, videos) via RLS SELECT policies
 * - Public inserts (RSVPs, contact, signups) via RLS INSERT policies
 * - Admin operations when signed in (RLS checks JWT role)
 * - Realtime subscriptions (theme settings, etc.)
 *
 * The anon key is SAFE to expose — RLS protects all data.
 * Admin access requires signing in via Supabase Auth with role = "admin".
 *
 * No proxy, no shim, no middleman — direct Supabase client.
 * If env vars are missing (e.g. during local dev without .env.local),
 * the client is still created — operations will simply fail gracefully
 * and hooks fall back to static content.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
