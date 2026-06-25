/**
 * SmoothScroll — wraps the app with Lenis v1.x for butter-smooth scrolling.
 * 
 * Uses `lenis/react` ReactLenis provider at the root level.
 * Framer Motion's useScroll works natively with Lenis because
 * Lenis drives the real scrollY — no integration hacks needed.
 * 
 * Respects prefers-reduced-motion automatically.
 */
"use client";

import { ReactLenis } from "lenis/react";

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        syncTouch: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
