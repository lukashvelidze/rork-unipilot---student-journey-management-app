import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

// Dummy webhook event schema (Paddle removed)
const dummyWebhookSchema = z.object({
  event_id: z.string().optional(),
  event_type: z.string().optional(),
  occurred_at: z.string().optional(),
  data: z.record(z.any()).optional(),
});

export const paddleWebhookProcedure = publicProcedure
  .input(dummyWebhookSchema)
  .mutation(async ({ input }) => {
    const { event_type, data } = input;

    try {
      console.log('🎭 Dummy webhook received:', { event_type, data });
      
      // Simulate webhook processing
      switch (event_type) {
        case 'subscription.created':
          console.log('🎭 Dummy subscription created:', data);
          // In a real app, you would update user's premium status here
          break;

        case 'subscription.updated':
          console.log('🎭 Dummy subscription updated:', data);
          break;

        case 'subscription.canceled':
          console.log('🎭 Dummy subscription canceled:', data);
          break;

        case 'transaction.completed':
          console.log('🎭 Dummy transaction completed:', data);
          // In a real app, you would activate premium features here
          break;

        case 'transaction.payment_failed':
          console.log('🎭 Dummy payment failed:', data);
          break;

        default:
          console.log('🎭 Dummy webhook event (unhandled):', event_type);
      }

      return { 
        success: true, 
        message: 'Dummy webhook processed successfully (Paddle removed)' 
      };
    } catch (error) {
      console.error('Dummy webhook processing error:', error);
      throw new Error('Failed to process dummy webhook');
    }
  });