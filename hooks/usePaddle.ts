import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { Paddle } from '@paddle/paddle-js';
import { useRouter } from 'expo-router';
import { initializePaddleService, openEmbeddedCheckout } from '@/lib/paddle';
import { useUserStore } from '@/store/userStore';

export const usePaddle = () => {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
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
        console.log('✅ Paddle hook initialized for', Platform.OS);
      } catch (error) {
        console.error('Failed to initialize Paddle:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initPaddle();
  }, []);

  const openCheckout = async (options?: any) => {
    try {
      setIsLoading(true);
      
      // Use embedded checkout for both web and mobile
      const result = await openEmbeddedCheckout('paddle-checkout', {
        priceId: typeof options === 'string' ? options : options?.priceId,
        customerEmail: options?.customer?.email || '',
        userId: options?.customData?.userId || 'anonymous',
        onSuccess: (data) => {
          console.log('✅ Payment successful:', data);
          setPremium(true);
          router.push('/payment-success');
        },
        onError: (error) => {
          console.error('❌ Payment error:', error);
          Alert.alert(
            'Payment Error',
            'There was an issue processing your payment. Please try again.',
            [{ text: 'OK' }]
          );
        },
        onClose: () => {
          console.log('❌ Checkout closed by user');
        }
      });

      return result;
      
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert(
        'Payment Error',
        'There was an issue processing your payment. Please try again.',
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