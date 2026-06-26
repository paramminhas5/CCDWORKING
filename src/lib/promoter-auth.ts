/**
 * Promoter auth — session token management.
 * Stores the promoter token in sessionStorage for the current browser tab.
 */

const STORAGE_KEY = "ccd_promoter_token";

export function getPromoterToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setPromoterToken(token: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // sessionStorage unavailable (SSR, private browsing on some browsers)
  }
}

export function clearPromoterToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}
