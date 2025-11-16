# Paddle Hosted Checkout Setup Guide

This guide explains how to set up Paddle hosted checkout for UniPilot subscription tiers.

## Prerequisites

1. A Paddle account with products configured
2. Three subscription products: Basic, Standard, and Pro
3. Price IDs for each subscription tier

## Configuration Steps

### 1. Get Your Paddle Price IDs

1. Log in to your [Paddle Dashboard](https://vendors.paddle.com/)
2. Navigate to **Products** > **Prices**
3. Find the price IDs for each of your subscription tiers:
   - Basic tier price ID
   - Standard tier price ID
   - Pro tier price ID
4. Copy each price ID (format: `pri_01h1vjg3sqjj1y9tvazkdqe5vt`)

### 2. Update Price IDs in Code

Edit `lib/paddle.ts` and replace the placeholder price IDs:

```typescript
export const PADDLE_PRICE_IDS = {
  basic: "pri_YOUR_BASIC_PRICE_ID_HERE",
  standard: "pri_YOUR_STANDARD_PRICE_ID_HERE",
  pro: "pri_YOUR_PRO_PRICE_ID_HERE",
};
```

### 3. Update Hosted Checkout URL

Replace the checkout base URL in `lib/paddle.ts` with your actual hosted checkout launch URL:

```typescript
export const PADDLE_CHECKOUT_BASE_URL = 
  "https://pay.paddle.com/checkout/YOUR_CHECKOUT_ID_HERE";
```

Or use environment variables:

```bash
EXPO_PUBLIC_PADDLE_CHECKOUT_URL=https://pay.paddle.com/checkout/YOUR_CHECKOUT_ID
EXPO_PUBLIC_PADDLE_PRICE_ID_BASIC=pri_YOUR_BASIC_PRICE_ID
EXPO_PUBLIC_PADDLE_PRICE_ID_STANDARD=pri_YOUR_STANDARD_PRICE_ID
EXPO_PUBLIC_PADDLE_PRICE_ID_PRO=pri_YOUR_PRO_PRICE_ID
```

### 4. Configure Deep Linking

The app is configured to handle deep links with the scheme `unipilot://`. The deep links are:
- Success: `unipilot://payment-success?tier={tier}`
- Cancel: `unipilot://premium`

These are already configured in `app.json` with `"scheme": "unipilot"`.

### 5. Set Up Paddle Webhooks (Recommended)

To automatically sync subscription status, set up Paddle webhooks:

1. Go to Paddle Dashboard > **Developer Tools** > **Webhooks**
2. Add a webhook endpoint (e.g., `https://your-api.com/webhooks/paddle`)
3. Subscribe to these events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `transaction.completed`

### 6. Test the Integration

1. Use Paddle's sandbox environment for testing
2. The current checkout URL uses sandbox: `https://sandbox-pay.paddle.io/...`
3. Test with Paddle's test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## How It Works

1. **User selects a tier**: User taps "Subscribe" on Basic, Standard, or Pro
2. **Checkout URL is built**: The app constructs a Paddle checkout URL with:
   - Price ID for the selected tier
   - User email (prefilled)
   - User ID (in passthrough data)
   - Success and cancel URLs for deep linking
3. **Paddle checkout opens**: The checkout opens in the device's browser
4. **User completes payment**: User enters payment details and completes purchase
5. **Redirect back to app**: Paddle redirects to `unipilot://payment-success?tier={tier}`
6. **Subscription activated**: The app updates the user's `subscription_tier` in the database

## Subscription Tiers

The app supports three subscription tiers:

- **Basic** ($4.99/month): Basic features and journey modules
- **Standard** ($9.99/month): All features, most popular
- **Pro** ($19.99/month): Premium features including AI assistance

## Database Schema

Subscriptions are stored in the `profiles` table with the `subscription_tier` field:
- `free` (default)
- `basic`
- `standard`
- `premium` (maps to Pro tier)

## Troubleshooting

### Checkout doesn't open
- Verify the checkout URL is correct
- Check that `Linking.canOpenURL()` returns true
- Ensure deep linking is configured in `app.json`

### Payment success screen doesn't load
- Verify deep linking scheme matches (`unipilot://`)
- Check that `payment-success` route is registered in `_layout.tsx`
- Ensure the tier parameter is passed in the URL

### Subscription not updating
- Check that the webhook handler is working (if using webhooks)
- Verify the payment-success screen is updating the database correctly
- Check Supabase RLS policies allow profile updates

## References

- [Paddle Hosted Checkout Documentation](https://developer.paddle.com/concepts/checkout/hosted-checkout)
- [Paddle Webhooks Guide](https://developer.paddle.com/webhooks/overview)
- [Expo Deep Linking](https://docs.expo.dev/guides/linking/)

