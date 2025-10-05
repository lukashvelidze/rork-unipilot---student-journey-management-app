import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { initializePaddleService, openEmbeddedCheckout } from '@/lib/paddle';
import { useUserStore } from '@/store/userStore';

// Dummy Paddle interface for type compatibility
interface DummyPaddle {
  Checkout: {
    open: (options: any) => void;
  };
}

export const usePaddle = () => {
  const [paddle, setPaddle] = useState<DummyPaddle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { setPremium } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    const initPaddle = async () => {
      try {
        setIsLoading(true);
        const paddleInstance = await initializePaddleService();
        setPaddle(paddleInstance);
        setIsInitialized(true);
        console.log('✅ Dummy Paddle hook initialized for', Platform.OS);
      } catch (error) {
        console.error('Failed to initialize dummy Paddle:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initPaddle();
  }, []);

  const openCheckout = async (options?: any) => {
    try {
      setIsLoading(true);
      
      // Use dummy embedded checkout for both web and mobile
      const result = await openEmbeddedCheckout('paddle-checkout', {
        priceId: typeof options === 'string' ? options : options?.priceId || 'dummy_price_123',
        customerEmail: options?.customer?.email || '',
        userId: options?.customData?.userId || 'anonymous',
        onSuccess: (data) => {
          console.log('✅ Dummy payment successful:', data);
          setPremium(true);
          router.push('/payment-success');
        },
        onError: (error) => {
          console.error('❌ Dummy payment error:', error);
          Alert.alert(
            'Demo Payment Error',
            'There was an issue with the demo payment. Please try again.',
            [{ text: 'OK' }]
          );
        },
        onClose: () => {
          console.log('❌ Demo checkout closed by user');
        }
      });

      return result;
      
    } catch (error) {
      console.error('Demo checkout error:', error);
      Alert.alert(
        'Demo Payment Error',
        'There was an issue with the demo payment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    paddle,
    isLoading,
    isInitialized,
    isReady: isInitialized,
    openCheckout,
  };
};