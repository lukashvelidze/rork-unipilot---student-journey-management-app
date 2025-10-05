import { z } from 'zod';
import { publicProcedure } from '../../../create-context';

// Mock subscription data - in a real app, this would come from your database
const mockSubscriptions = new Map([
  ['user_1', {
    id: 'sub_01jyk3h7eec66x5m7h31p66r8w',
    userId: 'user_1',
    status: 'active',
    plan: 'UniPilot Premium',
    priceId: 'pri_01jyk3h7eec66x5m7h31p66r8w',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    currentPeriodStart: '2024-01-15T00:00:00Z',
    currentPeriodEnd: '2024-02-15T00:00:00Z',
    nextBillingDate: '2024-02-15T00:00:00Z',
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expiryMonth: '12',
      expiryYear: '2025',
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  }],
]);

export const getSubscriptionProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    const { userId } = input;
    
    const subscription = mockSubscriptions.get(userId);
    
    if (!subscription) {
      return null;
    }
    
    return subscription;
  });

export const updateSubscriptionProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    subscriptionId: z.string(),
    status: z.enum(['active', 'canceled', 'past_due', 'paused']).optional(),
  }))
  .mutation(async ({ input }) => {
    const { userId, subscriptionId, status } = input;
    
    const subscription = mockSubscriptions.get(userId);
    
    if (!subscription || subscription.id !== subscriptionId) {
      throw new Error('Subscription not found');
    }
    
    if (status) {
      subscription.status = status;
      subscription.updatedAt = new Date().toISOString();
      mockSubscriptions.set(userId, subscription);
    }
    
    return subscription;
  });

export const cancelSubscriptionProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    subscriptionId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { userId, subscriptionId } = input;
    
    const subscription = mockSubscriptions.get(userId);
    
    if (!subscription || subscription.id !== subscriptionId) {
      throw new Error('Subscription not found');
    }
    
    // In a real app, you would call your payment provider's API to cancel the subscription (Paddle removed)
    subscription.status = 'canceled';
    subscription.updatedAt = new Date().toISOString();
    mockSubscriptions.set(userId, subscription);
    
    return {
      success: true,
      message: 'Subscription canceled successfully',
      subscription,
    };
  });