/**
 * Ticketing API — stub. Ticketing is not active in this build.
 * These functions are referenced by TicketTierPicker/CheckoutDialog/TransferDialog
 * which exist in the codebase but aren't rendered anywhere.
 */

export async function getEventTicketingConfig(_slug: string) {
  return { config: null, tiers: [] };
}

export async function createOrder(_data: any) {
  return { order: null, error: "Ticketing not configured" };
}

export async function verifyOrder(_data: any) {
  return { success: false, error: "Ticketing not configured" };
}

export async function initiateTransfer(_data: any) {
  return { success: false, error: "Ticketing not configured" };
}

export function verifyPromoterToken(_token: string) {
  return { valid: false, promoter: null };
}
