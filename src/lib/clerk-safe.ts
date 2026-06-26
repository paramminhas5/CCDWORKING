/**
 * Clerk safe stubs — Clerk is not active in this build.
 * These exports prevent import errors in components that reference Clerk
 * (FollowButton, PromoterLogin) without adding Clerk as a dependency.
 *
 * When Clerk is enabled (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY set), replace
 * these stubs with real @clerk/nextjs imports.
 */

export function isClerkEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

/**
 * Safe user hook — returns a consistent shape whether Clerk is active or not.
 */
export function useSafeUser(): { user: { id: string } | null; isLoaded: boolean; isSignedIn: boolean } {
  return { user: null, isLoaded: true, isSignedIn: false };
}
