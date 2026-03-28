# Subscriptions Documentation

UniPilot uses Paddle Billing for subscription management, providing a seamless payment experience across web and mobile platforms. This document covers the complete integration, usage patterns, and management of premium subscriptions.

## 🏗️ Paddle Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Paddle API    │    │   Backend API   │
│  (Web/Mobile)   │◄──►│   (Checkout)    │◄──►│   (Webhooks)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   User Store    │
                    │  (Local State)  │
                    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

```env
# Paddle Configuration
EXPO_PUBLIC_PADDLE_TOKEN=test_c25cc3df5ddfcd6b3b2a8420700
EXPO_PUBLIC_PADDLE_ENVIRONMENT=sandbox
EXPO_PUBLIC_PADDLE_PRICE_ID=pri_01jyk3h7eec66x5m7h31p66r8w

# Production values
# EXPO_PUBLIC_PADDLE_TOKEN=live_your_production_token
# EXPO_PUBLIC_PADDLE_ENVIRONMENT=production
# EXPO_PUBLIC_PADDLE_PRICE_ID=pri_production_price_id
```

### Paddle Setup

```typescript
// lib/paddle.ts
import { initializePaddle, Paddle } from '@paddle/paddle-js';

export const initializePaddleInstance = async (): Promise<Paddle | null> => {
  try {
    const paddle = await initializePaddle({
      environment: process.env.EXPO_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production',
      token: process.env.EXPO_PUBLIC_PADDLE_TOKEN!,
    });
    return paddle;
  } catch (error) {
    console.error('Failed to initialize Paddle:', error);
    return null;
  }
};
```

## 💳 Subscription Plans

### Current Pricing Structure

```typescript
// constants/subscriptions.ts
export const SUBSCRIPTION_PLANS = {
  premium: {
    priceId: 'pri_01jyk3h7eec66x5m7h31p66r8w',
    name: 'UniPilot Premium',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Advanced journey stages (post-acceptance)',
      'Unlimited AI assistant interactions',
      'Priority expert support',
      'Exclusive resources and guides',
      'Advanced progress analytics',
      'Premium community access',
    ],
  },
} as const;
```

### Feature Access Control

```typescript
// utils/subscriptionUtils.ts
export const getAccessibleFeatures = (isPremium: boolean) => {
  const freeFeatures = [
    'university_research',
    'application_process',
    'basic_community',
    'progress_tracking',
  ];

  const premiumFeatures = [
    'visa_guidance',
    'travel_planning',
    'ai_assistant_unlimited',
    'expert_support',
    'premium_resources',
    'advanced_analytics',
  ];

  return isPremium ? [...freeFeatures, ...premiumFeatures] : freeFeatures;
};

export const canAccessFeature = (feature: string, isPremium: boolean): boolean => {
  const accessibleFeatures = getAccessibleFeatures(isPremium);
  return accessibleFeatures.includes(feature);
};
```

## 🛒 Checkout Implementation

### Web Checkout (Direct Paddle Integration)

```typescript
// hooks/usePaddle.ts
import { useState, useEffect } from 'react';
import { initializePaddleInstance } from '@/lib/paddle';
import type { Paddle } from '@paddle/paddle-js';

export const usePaddle = () => {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initPaddle = async () => {
      setIsLoading(true);
      const paddleInstance = await initializePaddleInstance();
      setPaddle(paddleInstance);
      setIsReady(!!paddleInstance);
      setIsLoading(false);
    };

    initPaddle();
  }, []);

  const openCheckout = async (options: {
    priceId: string;
    customer?: { email: string };
    customData?: { userId: string };
  }) => {
    if (!paddle || !isReady) {
      throw new Error('Paddle not initialized');
    }

    return paddle.Checkout.open({
      items: [{ priceId: options.priceId, quantity: 1 }],
      customer: options.customer,
      customData: options.customData,
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
      },
    });
  };

  return { paddle, isReady, isLoading, openCheckout };
};
```

### Mobile Checkout (WebView Integration)

```typescript
// lib/paddle.ts
export const createCheckoutUrl = (options: {
  priceId: string;
  customerEmail: string;
  userId: string;
}) => {
  const baseUrl = 'https://checkout.paddle.com/checkout';
  const params = new URLSearchParams({
    vendor: process.env.EXPO_PUBLIC_PADDLE_VENDOR_ID!,
    product: options.priceId,
    email: options.customerEmail,
    passthrough: JSON.stringify({ userId: options.userId }),
    success_url: 'unipilot://payment-success',
    cancel_url: 'unipilot://payment-cancelled',
  });

  return `${baseUrl}?${params.toString()}`;
};
```

### Unified Checkout Component

```typescript
// components/PaddleCheckout.tsx
export default function PaddleCheckout({
  visible,
  onClose,
  onSuccess,
  onCancel,
  customerEmail = "",
  userId = "anonymous",
  priceId = "pri_01jyk3h7eec66x5m7h31p66r8w",
}: PaddleCheckoutProps) {
  const { openCheckout, isReady, isLoading } = usePaddle();
  const { user } = useUserStore();

  // Web implementation
  if (Platform.OS === 'web') {
    const handleWebCheckout = async () => {
      try {
        await openCheckout({
          priceId,
          customer: { email: customerEmail || user?.email || '' },
          customData: { userId: userId || user?.id || 'anonymous' },
        });
        onSuccess();
      } catch (error) {
        console.error('Checkout error:', error);
      }
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        {/* Web checkout UI */}
      </Modal>
    );
  }

  // Mobile WebView implementation
  const checkoutUrl = createCheckoutUrl({
    priceId,
    customerEmail: customerEmail || user?.email || '',
    userId: userId || user?.id || 'anonymous',
  });

  return (
    <Modal visible={visible} animationType="slide">
      <WebView
        source={{ uri: checkoutUrl }}
        onMessage={handleWebViewMessage}
        // WebView configuration
      />
    </Modal>
  );
}
```

## 🔄 Webhook Integration

### Backend Webhook Handler

```typescript
// backend/trpc/routes/paddle/webhook/route.ts
import { publicProcedure } from "../../create-context";
import { z } from "zod";

const paddleWebhookSchema = z.object({
  alert_name: z.string(),
  user_id: z.string().optional(),
  subscription_id: z.string().optional(),
  status: z.string().optional(),
  // Add other Paddle webhook fields
});

export const paddleWebhookProcedure = publicProcedure
  .input(paddleWebhookSchema)
  .mutation(async ({ input }) => {
    console.log('Paddle webhook received:', input);

    switch (input.alert_name) {
      case 'subscription_created':
        await handleSubscriptionCreated(input);
        break;
      case 'subscription_updated':
        await handleSubscriptionUpdated(input);
        break;
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(input);
        break;
      case 'payment_succeeded':
        await handlePaymentSucceeded(input);
        break;
      case 'payment_failed':
        await handlePaymentFailed(input);
        break;
      default:
        console.log('Unhandled webhook:', input.alert_name);
    }

    return { success: true };
  });

const handleSubscriptionCreated = async (data: any) => {
  // Update user's premium status
  // Store subscription details
  // Send welcome email
};

const handlePaymentSucceeded = async (data: any) => {
  // Confirm payment
  // Extend subscription
  // Update user status
};
```

### Webhook Security

```typescript
// Verify webhook signature
import crypto from 'crypto';

const verifyPaddleWebhook = (body: string, signature: string): boolean => {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};
```

## 📊 Subscription Management

### User Subscription State

```typescript
// store/userStore.ts
interface UserState {
  user: UserProfile | null;
  isPremium: boolean;
  subscriptionData: {
    id: string;
    status: 'active' | 'cancelled' | 'expired';
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  
  setPremium: (isPremium: boolean) => void;
  updateSubscription: (data: SubscriptionData) => void;
  cancelSubscription: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // ... other state
      isPremium: false,
      subscriptionData: null,
      
      setPremium: (isPremium) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                isPremium,
                premiumSince: isPremium ? new Date().toISOString() : null,
              }
            : null,
          isPremium,
        })),
      
      updateSubscription: (data) =>
        set({ subscriptionData: data }),
      
      cancelSubscription: () =>
        set((state) => ({
          subscriptionData: state.subscriptionData
            ? { ...state.subscriptionData, cancelAtPeriodEnd: true }
            : null,
        })),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Subscription Status Checking

```typescript
// hooks/useSubscription.ts
export const useSubscription = () => {
  const { user, isPremium, subscriptionData } = useUserStore();
  
  const isSubscriptionActive = useMemo(() => {
    if (!subscriptionData) return false;
    
    const now = new Date();
    const periodEnd = new Date(subscriptionData.currentPeriodEnd);
    
    return (
      subscriptionData.status === 'active' &&
      now < periodEnd &&
      !subscriptionData.cancelAtPeriodEnd
    );
  }, [subscriptionData]);
  
  const daysUntilExpiry = useMemo(() => {
    if (!subscriptionData?.currentPeriodEnd) return null;
    
    const now = new Date();
    const periodEnd = new Date(subscriptionData.currentPeriodEnd);
    const diffTime = periodEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [subscriptionData]);
  
  return {
    isPremium,
    isSubscriptionActive,
    subscriptionData,
    daysUntilExpiry,
  };
};
```

## 🎯 Premium Feature Gating

### Component-Level Access Control

```typescript
// components/PremiumGate.tsx
interface PremiumGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string;
  showUpgrade?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  fallback,
  feature,
  showUpgrade = true,
}) => {
  const { isPremium } = useSubscription();
  const hasAccess = feature ? canAccessFeature(feature, isPremium) : isPremium;
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showUpgrade) {
    return <PremiumUpgradePrompt feature={feature} />;
  }
  
  return null;
};

// Usage
<PremiumGate feature="ai_assistant_unlimited">
  <AIAssistant />
</PremiumGate>
```

### Route-Level Protection

```typescript
// app/premium/resources.tsx
export default function PremiumResourcesScreen() {
  const { isPremium } = useSubscription();
  const router = useRouter();
  
  useEffect(() => {
    if (!isPremium) {
      router.replace('/premium');
    }
  }, [isPremium, router]);
  
  if (!isPremium) {
    return <PremiumUpgradeScreen />;
  }
  
  return <PremiumResourcesList />;
}
```

### Journey Stage Access Control

```typescript
// utils/journeyAccess.ts
export const getAccessibleJourneyStages = (
  allStages: JourneyStage[],
  isPremium: boolean
): JourneyStage[] => {
  const freeStageLimit = 2; // Research and Application stages
  
  if (isPremium) {
    return allStages;
  }
  
  return allStages.map((stage, index) => ({
    ...stage,
    locked: index >= freeStageLimit,
    tasks: stage.tasks.map(task => ({
      ...task,
      locked: index >= freeStageLimit,
    })),
  }));
};
```

## 📈 Analytics & Metrics

### Subscription Analytics

```typescript
// utils/subscriptionAnalytics.ts
export const trackSubscriptionEvent = (
  event: 'checkout_started' | 'checkout_completed' | 'subscription_cancelled',
  data?: Record<string, any>
) => {
  // Analytics implementation
  console.log('Subscription event:', event, data);
  
  // Example: Mixpanel tracking
  // mixpanel.track(event, {
  //   ...data,
  //   timestamp: new Date().toISOString(),
  // });
};

// Usage in components
const handleCheckoutStart = () => {
  trackSubscriptionEvent('checkout_started', {
    priceId: SUBSCRIPTION_PLANS.premium.priceId,
    source: 'premium_page',
  });
  setCheckoutVisible(true);
};
```

### Conversion Tracking

```typescript
// hooks/useConversionTracking.ts
export const useConversionTracking = () => {
  const trackConversion = useCallback((
    stage: 'view_premium' | 'start_checkout' | 'complete_purchase',
    metadata?: Record<string, any>
  ) => {
    const event = {
      stage,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    
    // Track conversion funnel
    console.log('Conversion event:', event);
  }, []);
  
  return { trackConversion };
};
```

## 🔄 Subscription Lifecycle Management

### Upgrade Flow

```typescript
// components/UpgradeFlow.tsx
export const UpgradeFlow: React.FC = () => {
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const { setPremium } = useUserStore();
  const { trackConversion } = useConversionTracking();
  
  const handleUpgradeSuccess = useCallback(() => {
    setPremium(true);
    trackConversion('complete_purchase');
    
    // Show success animation
    // Navigate to premium features
    router.push('/premium/welcome');
  }, [setPremium, trackConversion]);
  
  return (
    <>
      <Button
        title="Upgrade to Premium"
        onPress={() => {
          trackConversion('start_checkout');
          setCheckoutVisible(true);
        }}
      />
      
      <PaddleCheckout
        visible={checkoutVisible}
        onClose={() => setCheckoutVisible(false)}
        onSuccess={handleUpgradeSuccess}
        onCancel={() => trackConversion('checkout_cancelled')}
      />
    </>
  );
};
```

### Cancellation Flow

```typescript
// components/CancellationFlow.tsx
export const CancellationFlow: React.FC = () => {
  const { subscriptionData, cancelSubscription } = useUserStore();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleCancelSubscription = async () => {
    try {
      // Call backend to cancel subscription
      await trpcClient.user.cancelSubscription.mutate({
        subscriptionId: subscriptionData?.id,
      });
      
      cancelSubscription();
      
      // Show cancellation confirmation
      Alert.alert(
        'Subscription Cancelled',
        'Your subscription will remain active until the end of your current billing period.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Cancellation error:', error);
      Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
    }
  };
  
  return (
    <View>
      <Button
        title="Cancel Subscription"
        variant="outline"
        onPress={() => setShowConfirmation(true)}
      />
      
      <Modal visible={showConfirmation}>
        {/* Cancellation confirmation UI */}
      </Modal>
    </View>
  );
};
```

## 🚨 Error Handling

### Payment Error Handling

```typescript
// utils/paymentErrorHandler.ts
export const handlePaymentError = (error: any) => {
  console.error('Payment error:', error);
  
  let userMessage = 'Payment failed. Please try again.';
  
  if (error.code === 'card_declined') {
    userMessage = 'Your card was declined. Please try a different payment method.';
  } else if (error.code === 'insufficient_funds') {
    userMessage = 'Insufficient funds. Please check your account balance.';
  } else if (error.code === 'network_error') {
    userMessage = 'Network error. Please check your connection and try again.';
  }
  
  Alert.alert('Payment Error', userMessage, [
    { text: 'OK' },
    { text: 'Contact Support', onPress: () => openSupportChat() },
  ]);
};
```

### Subscription State Recovery

```typescript
// utils/subscriptionRecovery.ts
export const recoverSubscriptionState = async (userId: string) => {
  try {
    // Fetch latest subscription status from backend
    const subscription = await trpcClient.user.getSubscription.query({ userId });
    
    if (subscription) {
      const { updateSubscription, setPremium } = useUserStore.getState();
      updateSubscription(subscription);
      setPremium(subscription.status === 'active');
    }
  } catch (error) {
    console.error('Failed to recover subscription state:', error);
  }
};
```

## 📋 Testing Subscriptions

### Test Cards (Sandbox)

```typescript
// constants/testData.ts
export const TEST_CARDS = {
  success: {
    number: '4000000000000002',
    expiry: '12/25',
    cvc: '123',
  },
  declined: {
    number: '4000000000000010',
    expiry: '12/25',
    cvc: '123',
  },
  insufficient_funds: {
    number: '4000000000009995',
    expiry: '12/25',
    cvc: '123',
  },
};
```

### Automated Testing

```typescript
// __tests__/subscription.test.ts
describe('Subscription Flow', () => {
  it('should handle successful subscription', async () => {
    const { result } = renderHook(() => useUserStore());
    
    act(() => {
      result.current.setPremium(true);
    });
    
    expect(result.current.isPremium).toBe(true);
  });
  
  it('should gate premium features correctly', () => {
    const { getByText, queryByText } = render(
      <PremiumGate>
        <Text>Premium Content</Text>
      </PremiumGate>
    );
    
    // Should show upgrade prompt for non-premium users
    expect(queryByText('Premium Content')).toBeNull();
    expect(getByText(/upgrade/i)).toBeTruthy();
  });
});
```

This comprehensive subscription system provides a robust foundation for monetizing UniPilot while delivering clear value to premium users through advanced features and enhanced support.