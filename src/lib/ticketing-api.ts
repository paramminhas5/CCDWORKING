/**
 * Ticketing API — stub. Ticketing is not active in this build.
 * These functions are referenced by TicketTierPicker/CheckoutDialog/TransferDialog
 * which exist in the codebase but aren't rendered anywhere yet.
 *
 * When ticketing goes live, replace these stubs with real API calls.
 */

export interface CreateOrderResponse {
  order_id: string;
  free: boolean;
  qr_tokens: string[];
  amount_paise: number;
  razorpay_order_id: string;
}

export async function getEventTicketingConfig(_slug: string) {
  return { config: null, tiers: [] };
}

export async function createOrder(_data: any): Promise<CreateOrderResponse> {
  throw new Error("Ticketing not configured");
}

export async function verifyOrder(_orderId: string, _payment: any): Promise<{ success: boolean }> {
  throw new Error("Ticketing not configured");
}

export async function initiateTransfer(_qrToken: string, _data: { to_email: string; to_name?: string }): Promise<{ success: boolean }> {
  throw new Error("Ticketing not configured");
}

export interface VerifyPromoterResponse {
  valid: boolean;
  promoter: any;
  promoter_user: { display_name: string } | null;
}

export async function verifyPromoterToken(_token: string): Promise<VerifyPromoterResponse> {
  throw new Error("Promoter portal not configured");
}
