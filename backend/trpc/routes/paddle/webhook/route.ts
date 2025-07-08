import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

// Paddle webhook event schema
const paddleWebhookSchema = z.object({
  event_id: z.string(),
  event_type: z.string(),
  occurred_at: z.string(),
  data: z.record(z.any()),
});

export const paddleWebhookProcedure = publicProcedure
  .input(paddleWebhookSchema)
  .mutation(async ({ input }) => {
    const { event_type, data } = input;

    try {
      switch (event_type) {
        case 'subscription.created':
          console.log('Subscription created:', data);
          // Handle subscription creation
          // Update user's premium status in your database
          break;

        case 'subscription.updated':
          console.log('Subscription updated:', data);
          // Handle subscription updates
          break;

        case 'subscription.canceled':
          console.log('Subscription canceled:', data);
          // Handle subscription cancellation
          // Remove user's premium status
          break;

        case 'transaction.completed':
          console.log('Transaction completed:', data);
          // Handle successful payment
          // Activate premium features
          break;

        case 'transaction.payment_failed':
          console.log('Payment failed:', data);
          // Handle failed payment
          // Send notification to user
          break;

        default:
          console.log('Unhandled webhook event:', event_type);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw new Error('Failed to process webhook');
    }
  });