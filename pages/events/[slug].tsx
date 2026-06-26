/**
 * /events/[slug] — Static-generated event detail page.
 *
 * Strategy:
 *  - getStaticPaths: pre-render known slugs from the static content catalogue.
 *  - getStaticProps: fetch event from Supabase (service key), fallback to static catalogue.
 *  - revalidate: 60s ISR — fresh content within 1 minute of any change.
 *
 * The EventDetail component receives the event as a prop and renders immediately.
 */
import type { GetStaticPaths, GetStaticProps } from "next";
import { getStaticEventRow, EVENT_ROWS } from "@/content/events";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { EventRow } from "@/types/events";
import EventDetailPage from "@/pages/EventDetail";

interface Props {
  event: EventRow;
  slug: string;
}

export default function EventSlugPage({ event, slug }: Props) {
  // key is handled by _app.tsx via router.asPath — forces remount on navigation
  return <EventDetailPage event={event} slug={slug} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = Object.keys(EVENT_ROWS).map((slug) => ({ params: { slug } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = (params?.slug as string) ?? "";

  let event: EventRow | null = null;

  // 1. Try Supabase (server-side, service key)
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (data) event = data as EventRow;
    } catch {
      // Supabase unavailable — fall through to static
    }
  }

  // 2. Static fallback
  if (!event) {
    event = getStaticEventRow(slug);
  }

  // 3. Unknown slug → 404
  if (!event) {
    return { notFound: true };
  }

  return {
    props: { event, slug },
    revalidate: 60,
  };
};
