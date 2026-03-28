/**
 * Paddle Configuration
 * 
 * Replace the price IDs below with your actual Paddle price IDs from your Paddle dashboard.
 * You can find these in: Paddle Dashboard > Products > Prices
 */

// Paddle Hosted Checkout Launch URL
// Replace with your actual hosted checkout launch URL from Paddle
export const PADDLE_CHECKOUT_BASE_URL = 
  process.env.EXPO_PUBLIC_PADDLE_CHECKOUT_URL || 
  "https://sandbox-pay.paddle.io/hsc_01ka7f3k5r8n7sx4xdj2rsdhwc_cjd90yp7jrg8kkgpa0heydm3h9n5f84z";

// Optional Paddle customer portal URL (for managing subscriptions)
// Example: https://customer.paddle.com/ or your hosted portal URL
export const PADDLE_CUSTOMER_PORTAL_URL =
  process.env.EXPO_PUBLIC_PADDLE_CUSTOMER_PORTAL_URL || "";

// Price IDs for each subscription tier
// TODO: Replace these with your actual Paddle price IDs
export const PADDLE_PRICE_IDS = {
  basic: process.env.EXPO_PUBLIC_PADDLE_PRICE_ID_BASIC || "pri_01jyk3h7eec66x5m7h31p66r8w",
  standard: process.env.EXPO_PUBLIC_PADDLE_PRICE_ID_STANDARD || "pri_01k68wrm9arskqwz894n5afswq",
  pro: process.env.EXPO_PUBLIC_PADDLE_PRICE_ID_PRO || "pri_01ka7djg7ekbhah3gbamqemgf6",
};

/**
 * Build Paddle checkout URL with parameters
 */
export interface PaddleCheckoutParams {
  priceId: string;
  userEmail?: string;
  userId?: string;
  tier: "basic" | "standard" | "pro";
  countryCode?: string;
  postalCode?: string;
}

export function buildPaddleCheckoutUrl(params: PaddleCheckoutParams): string {
  const url = new URL(PADDLE_CHECKOUT_BASE_URL);
  
  // Required: Price ID
  url.searchParams.set("price_id", params.priceId);
  
  // Optional: Prefill customer information
  if (params.userEmail) {
    url.searchParams.set("customer_email", params.userEmail);
  }
  
  // Add custom passthrough data to identify the user and tier
  if (params.userId) {
    url.searchParams.set("passthrough", JSON.stringify({
      user_id: params.userId,
      tier: params.tier,
    }));
  }
  
  // Add success and cancel URLs for deep linking back to app
  // Paddle may append customer_id and other parameters to the success URL
  const successUrl = `unipilot://payment-success?tier=${params.tier}`;
  const cancelUrl = `unipilot://premium`;
  
  url.searchParams.set("success_url", successUrl);
  url.searchParams.set("cancel_url", cancelUrl);
  
  // Note: Paddle may append customer_id to the success_url as a query parameter
  // If not in URL, customer_id will be set via webhook (recommended approach)
  
  // Optional: Additional customer information
  if (params.countryCode) {
    url.searchParams.set("customer_country_code", params.countryCode);
  }
  
  if (params.postalCode) {
    url.searchParams.set("customer_postal_code", params.postalCode);
  }
  
  return url.toString();
}

/**
 * Check if device can make payments
 * Note: This is mainly for iOS. For React Native, we'll assume web payments work.
 */
export function canMakePayments(): boolean {
  // In React Native, web payments should work on all devices
  // For iOS-specific checks, you might want to use a native module
  return true;
}

export function buildPaddleCustomerPortalUrl(customerId: string): string | null {
  if (!PADDLE_CUSTOMER_PORTAL_URL) {
    return null;
  }

  const url = new URL(PADDLE_CUSTOMER_PORTAL_URL);
  url.searchParams.set("customer_id", customerId);
  return url.toString();
}
