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
 * When env vars are missing (e.g. build without .env.local), we create
 * a minimal no-op client that returns empty data without throwing.
 * This keeps SSG/ISR builds working — hooks fall back to static content.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Create a no-op client when env vars are missing.
 * Only used during SSG builds without env configuration.
 * Every method returns empty results — hooks then fall back to static content.
 */
function createNoopClient(): SupabaseClient {
  const noopChain: any = new Proxy(
    {},
    {
      get() {
        // Every chained method returns the same proxy, resolving to { data: null/[], error: null }
        return (..._args: any[]) => noopChain;
      },
    }
  );
  // Make the proxy thenable so await resolves to empty data
  noopChain.then = (resolve: any) => resolve({ data: [], error: null });

  return {
    from: () => ({
      select: () => ({
        order: () => ({ data: [], error: null, eq: () => ({ data: [], error: null, single: () => ({ data: null, error: null }), maybeSingle: () => ({ data: null, error: null }) }) }),
        eq: () => ({ data: [], error: null, single: () => ({ data: null, error: null }), maybeSingle: () => ({ data: null, error: null }) }),
        single: () => ({ data: null, error: null }),
        maybeSingle: () => ({ data: null, error: null }),
        limit: () => ({ data: [], error: null }),
        data: [],
        error: null,
      }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: "Supabase not configured", code: "NOT_CONFIGURED" } }) }), data: null, error: { message: "Supabase not configured", code: "NOT_CONFIGURED" } }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      signInWithOtp: () => Promise.resolve({ data: {}, error: { message: "Supabase not configured" } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    removeChannel: () => Promise.resolve(),
    storage: {
      from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `/${path}` } }) }),
    },
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createNoopClient();
