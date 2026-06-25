import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "@/lib/compat-router";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import MarqueeBySlot from "@/components/MarqueeBySlot";
import About from "@/components/About";
import Events from "@/components/Events";
import CcdxSocialHomeStrip from "@/components/CcdxSocialHomeStrip";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SectionReveal from "@/components/SectionReveal";
import SEO from "@/components/SEO";
import MoonwalkCat from "@/components/MoonwalkCat";

const Playlist = lazy(() => import("@/components/Playlist"));
const Drops = lazy(() => import("@/components/Drops"));
const Videos = lazy(() => import("@/components/Videos"));
const EarlyAccess = lazy(() => import("@/components/EarlyAccess"));

const SectionFallback = ({ bg = "bg-cream" }: { bg?: string }) => (
  <div className={`${bg} border-b-4 border-ink min-h-[220px] animate-pulse`} aria-hidden />
);

const Index = () => {
  useSmoothScroll();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#early-access") {
      setTimeout(() => {
        document.getElementById("early-access")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [location.hash]);

  return (
    <>
      <SEO
        title="Cats Can Dance — India's Underground Electronic Music Scene"
        description="Discover India's underground electronic music scene. Events in Bengaluru, Mumbai, Delhi & Goa. Artist directory, genre guides, global scene origins and limited apparel drops."
        path="/"
        keywords="india electronic music, bangalore underground, mumbai techno, delhi house, goa trance, electronic music india, cats can dance, jungle drum bass india"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Cats Can Dance",
            url: "https://catscandance.com",
            logo: "https://catscandance.com/og-image.png",
            description: "Bangalore underground crew — dance music nights, limited apparel drops, CCD goods, and cool culture & streetwear.",
            sameAs: ["https://instagram.com/catscandance"],
          },
        ]}
      />
      <main className="bg-background text-foreground">
        <Nav />
        <MoonwalkCat />
        <Hero />
        {/* ── Identity strip ── */}
        <div className="bg-ink border-b-4 border-ink py-3 px-4">
          <p className="container font-display text-cream text-xs md:text-sm uppercase tracking-[0.18em] text-center">
            Bengaluru underground crew · Dance music episodes · Limited streetwear drops
          </p>
        </div>
        <MarqueeBySlot id="above-about" />
        <SectionReveal><About /></SectionReveal>
        {/* ── EarlyAccess — email capture ── */}
        <Suspense fallback={<SectionFallback bg="bg-electric-blue" />}>
          <SectionReveal><EarlyAccess /></SectionReveal>
        </Suspense>
        <MarqueeBySlot id="above-events" />
        {/* ── Next Event Poster — front and center ── */}
        <section className="bg-ink border-b-4 border-ink py-12 md:py-16">
          <div className="container flex flex-col items-center text-center">
            <p className="font-display text-acid-yellow text-xs uppercase tracking-[0.3em] mb-4">
              ▶ NEXT EVENT
            </p>
            <div className="w-full max-w-md mx-auto mb-6">
              <img
                src="/episodes/episode-01.png"
                alt="CCD×SOCIAL Episode 01 — Sun 29 Jun, Indiranagar Social"
                className="w-full h-auto border-4 border-cream/20"
              />
            </div>
            <h2 className="font-display text-cream text-3xl md:text-5xl mb-3">CCD×SOCIAL 01</h2>
            <p className="font-display text-cream/70 text-lg mb-6">Sun 29 Jun · Indiranagar Social · Free RSVP</p>
            <a
              href="/events/ccdxsocial-01"
              className="bg-acid-yellow text-ink font-display text-lg px-8 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform"
            >
              RSVP NOW — IT'S FREE →
            </a>
          </div>
        </section>
        <SectionReveal><Events /></SectionReveal>
        <SectionReveal><CcdxSocialHomeStrip /></SectionReveal>
        <MarqueeBySlot id="above-videos" />
        <Suspense fallback={<SectionFallback bg="bg-ink" />}>
          <SectionReveal><Videos /></SectionReveal>
        </Suspense>
        <MarqueeBySlot id="above-playlist" />
        <Suspense fallback={<SectionFallback bg="bg-magenta" />}>
          <SectionReveal><Playlist /></SectionReveal>
        </Suspense>
        <MarqueeBySlot id="above-drops" />
        <Suspense fallback={<SectionFallback bg="bg-cream" />}>
          <SectionReveal id="drops"><Drops /></SectionReveal>
        </Suspense>
        <Contact />
        <Footer />
      </main>
    </>
  );
};

export default Index;
