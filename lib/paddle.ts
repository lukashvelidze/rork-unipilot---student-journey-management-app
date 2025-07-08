import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { Platform } from 'react-native';

let paddleInstance: Paddle | null = null;

export const initializePaddleService = async (): Promise<Paddle | null> => {
  try {
    // Only initialize on mobile platforms
    if (Platform.OS === 'web') {
      console.warn('Paddle is not supported on web platform');
      return null;
    }

    if (paddleInstance) {
      return paddleInstance;
    }

    paddleInstance = await initializePaddle({
      environment: 'sandbox', // Use 'production' for live environment
      token: 'test_c25cc3df5ddfcd6b3b2a8420700',
    });

    return paddleInstance;
  } catch (error) {
    console.error('Failed to initialize Paddle:', error);
    return null;
  }
};

export const openPaddleCheckout = async (priceId: string = 'pri_01jyk3h7eec66x5m7h31p66r8w') => {
  try {
    if (Platform.OS === 'web') {
      // On web, redirect to external checkout
      const checkoutUrl = `https://lukashvelidze.github.io/unipilot/`;
      window.open(checkoutUrl, '_blank');
      return;
    }

    const paddle = await initializePaddleService();
    
    if (!paddle) {
      throw new Error('Paddle not initialized');
    }

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: {
        email: '', // Will be filled by user in checkout
      },
      customData: {
        app: 'unipilot',
        platform: Platform.OS,
      },
    });
  } catch (error) {
    console.error('Failed to open Paddle checkout:', error);
    throw error;
  }
};

export const getPaddleInstance = (): Paddle | null => {
  return paddleInstance;
};