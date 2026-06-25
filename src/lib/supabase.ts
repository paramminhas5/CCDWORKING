/**
 * Supabase browser client — uses the public anon key.
 * 
 * This single client handles EVERYTHING:
 * - Public reads (events, videos) via RLS SELECT policies
 * - Public inserts (RSVPs, contact, signups) via RLS INSERT policies
 * - Admin operations when signed in (RLS checks JWT role)
 * 
 * The anon key is SAFE to expose — RLS protects all data.
 * Admin access requires signing in via Supabase Auth with role = "admin".
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function createSafeClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During SSG/dev without env vars — return a proxy that never throws
    return new Proxy({} as SupabaseClient, {
      get: (_target, prop) => {
        if (prop === "auth") {
          return {
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signInWithOtp: () => Promise.resolve({ data: {}, error: { message: "Supabase not configured" } }),
            signOut: () => Promise.resolve({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          };
        }
        if (prop === "from") {
          return () => ({
            select: () => ({ order: () => ({ data: [], error: null, eq: () => ({ data: [], error: null, single: () => ({ data: null, error: null }), maybeSingle: () => ({ data: null, error: null }) }) }), eq: () => ({ data: [], error: null, single: () => ({ data: null, error: null }), maybeSingle: () => ({ data: null, error: null }) }), single: () => ({ data: null, error: null }), maybeSingle: () => ({ data: null, error: null }), data: [], error: null }),
            insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: "Supabase not configured", code: "NOT_CONFIGURED" } }) }), data: null, error: { message: "Supabase not configured", code: "NOT_CONFIGURED" } }),
            update: () => ({ eq: () => ({ data: null, error: null }) }),
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
