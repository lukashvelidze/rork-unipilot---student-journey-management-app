import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { Paddle } from '@paddle/paddle-js';
import { useRouter } from 'expo-router';
import { initializePaddleService, openPaddleCheckout } from '@/lib/paddle';
import { useUserStore } from '@/store/userStore';

export const usePaddle = () => {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { setPremium } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    const initPaddle = async () => {
      if (Platform.OS === 'web') {
        setIsInitialized(true);
        return;
      }

      try {
        setIsLoading(true);
        const paddleInstance = await initializePaddleService();
        setPaddle(paddleInstance);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Paddle:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initPaddle();
  }, []);

  const openCheckout = async (priceId?: string) => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'web') {
        // On web, open external checkout
        const checkoutUrl = 'https://lukashvelidze.github.io/unipilot/';
        window.open(checkoutUrl, '_blank');
        return;
      }

      await openPaddleCheckout(priceId);
      
      // For demo purposes, simulate successful payment after checkout opens
      // In a real app, you'd handle this through webhooks or checkout events
      setTimeout(() => {
        router.push('/payment-success');
      }, 3000);
      
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
    openCheckout,
  };
};