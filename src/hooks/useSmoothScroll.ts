/**
 * useSmoothScroll — previously used Lenis for smooth scrolling.
 * Removed because it caused lag/jitter with Framer Motion parallax.
 * Native browser scrolling (with CSS scroll-behavior: smooth) is smoother.
 */
export const useSmoothScroll = () => {
  // No-op — native scroll is used instead.
};
