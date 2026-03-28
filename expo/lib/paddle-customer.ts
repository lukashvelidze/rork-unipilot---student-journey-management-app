/**
 * Paddle Customer ID Management
 * 
 * Functions to store and retrieve Paddle customer IDs for linking
 * Supabase profiles to Paddle customers for webhook processing.
 * 
 * This follows the Stripe/Paddle pattern:
 * 1. User subscribes → Paddle returns customer.id
 * 2. Store customer.id in profile.paddle_customer_id
 * 3. Webhooks can now match customer_id to Supabase profile
 * 4. Database updates subscription tier automatically via webhooks
 */

import { supabase } from "./supabase";

/**
 * Store Paddle customer ID in user's profile
 * This links the Supabase profile to the Paddle customer for webhook processing
 * 
 * @param customerId - The Paddle customer ID (e.g., "ctm_01234abcd")
 * @returns Promise that resolves when the customer ID is stored
 */
export async function storePaddleCustomerId(customerId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn("No authenticated user found. Cannot store Paddle customer ID.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        paddle_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error storing Paddle customer ID:", error);
      throw error;
    }

    console.log("Successfully stored Paddle customer ID:", customerId);
  } catch (error) {
    console.error("Failed to store Paddle customer ID:", error);
    throw error;
  }
}

/**
 * Get Paddle customer ID from user's profile
 * 
 * @returns Promise that resolves with the customer ID or null if not found
 */
export async function getPaddleCustomerId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("paddle_customer_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching Paddle customer ID:", error);
      return null;
    }

    return profile?.paddle_customer_id || null;
  } catch (error) {
    console.error("Failed to get Paddle customer ID:", error);
    return null;
  }
}

