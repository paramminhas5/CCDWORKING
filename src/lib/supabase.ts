/**
 * Supabase browser client — uses the public anon key.
 * Safe to import anywhere (client components, hooks, etc.)
 * 
 * RLS policies on Supabase protect data:
 * - events: public read
 * - event_rsvps: public insert, service-role read
 * - contact_messages: public insert
 * - early_access_signups: public insert
 * - site_videos: public read
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Create a real client if configured, otherwise a dummy that returns empty results
function createSafeClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a proxy that mimics Supabase client but returns empty/null for all operations
    // This prevents crashes during SSG when env vars aren't set
    return new Proxy({} as SupabaseClient, {
      get: (_target, prop) => {
        if (prop === "from") {
          return () => ({
            select: () => ({ order: () => ({ data: [], error: null }), eq: () => ({ single: () => ({ data: null, error: { message: "Supabase not configured" } }), maybeSingle: () => ({ data: null, error: null }), data: [], error: null }), data: [], error: null }),
            insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: "Supabase not configured" } }) }), data: null, error: { message: "Supabase not configured" } }),
            update: () => ({ eq: () => ({ data: null, error: { message: "Supabase not configured" } }) }),
            delete: () => ({ eq: () => ({ data: null, error: null }) }),
          });
        }
        if (prop === "storage") {
          return { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `/${path}` } }) }) };
        }
        return () => ({ data: null, error: null });
      },
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSafeClient();
