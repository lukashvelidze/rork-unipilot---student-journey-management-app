import React, { useEffect, useState } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import Button from '@/components/Button';
import { useUserStore } from '@/store/userStore';

interface PaddleFormProps {
  productId?: string;
  productName?: string;
  price?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  buttonTitle?: string;
  buttonVariant?: "primary" | "secondary" | "outline" | "text" | "destructive";
  disabled?: boolean;
}

declare global {
  interface Window {
    Paddle?: {
      Setup: (config: any) => void;
      Checkout: {
        open: (config: any) => void;
      };
    };
  }
}

const PaddleForm: React.FC<PaddleFormProps> = ({
  productId = 'pro_01jyk34xa92kd6h2x3vw7sv5tf', // Placeholder - replace with actual product ID
  productName = 'UniPilot Premium',
  price = '$4.99',
  onSuccess,
  onError,
  buttonTitle = `Subscribe ${price}`,
  buttonVariant = 'primary',
  disabled = false,
}) => {
  const { user, setPremium } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [paddleLoaded, setPaddleLoaded] = useState(false);

  // Load Paddle.js for web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      console.log('🚀 Loading Paddle.js for web checkout');
      
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Paddle.js loaded successfully');
        
        if (window.Paddle) {
          try {
            // Initialize Paddle with client token
            window.Paddle.Setup({
              token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_e8c70f35e280794bf86dfec199c',
              pwCustomer: {
                email: user?.email || '',
              },
              eventCallback: (data: any) => {
                console.log('🎯 Paddle Event:', data);
                
                switch (data.name) {
                  case 'checkout.loaded':
                    console.log('📦 Checkout loaded');
                    break;
                  case 'checkout.customer.created':
                    console.log('👤 Customer created:', data.data);
                    break;
                  case 'checkout.completed':
                    console.log('✅ Checkout completed:', data.data);
                    handleCheckoutSuccess(data.data);
                    break;
                  case 'checkout.closed':
                    console.log('❌ Checkout closed');
                    setIsLoading(false);
                    break;
                  case 'checkout.error':
                    console.error('💥 Checkout error:', data.data);
                    handleCheckoutError(data.data);
                    break;
                }
              },
            });
            
            setPaddleLoaded(true);
            console.log('🎉 Paddle initialized successfully');
          } catch (error) {
            console.error('💥 Error initializing Paddle:', error);
            setPaddleLoaded(false);
          }
        }
      };
      
      script.onerror = () => {
        console.error('💥 Failed to load Paddle.js');
        setPaddleLoaded(false);
      };
      
      document.head.appendChild(script);
      
      return () => {
        try {
          document.head.removeChild(script);
        } catch (error) {
          // Script might already be removed
        }
      };
    }
  }, [user?.email]);

  const handleCheckoutSuccess = (data: any) => {
    console.log('🎉 Payment successful:', data);
    
    // Update user premium status
    setPremium(true);
    
    // Show success message
    Alert.alert(
      'Payment Successful!',
      `Welcome to ${productName}! You now have access to all premium features.`,
      [
        {
          text: 'Explore Features',
          onPress: () => {
            onSuccess?.();
          },
        },
      ]
    );
    
    setIsLoading(false);
  };

  const handleCheckoutError = (error: any) => {
    console.error('💥 Payment failed:', error);
    
    Alert.alert(
      'Payment Failed',
      'There was an issue processing your payment. Please try again.',
      [{ text: 'OK' }]
    );
    
    onError?.(error);
    setIsLoading(false);
  };

  const handleSubscribe = async () => {
    console.log('🚀 Starting checkout process');
    setIsLoading(true);

    try {
      if (Platform.OS === 'web') {
        if (window.Paddle && paddleLoaded) {
          console.log('💳 Opening Paddle checkout on web');
          
          window.Paddle.Checkout.open({
            items: [
              {
                priceId: productId,
                quantity: 1,
              },
            ],
            customer: {
              email: user?.email || '',
            },
            customData: {
              userId: user?.id || '',
              productName: productName,
            },
            settings: {
              displayMode: 'overlay',
              theme: 'light',
              locale: 'en',
            },
          });
        } else {
          console.log('🌐 Fallback: Opening Paddle checkout page in new tab');
          // Fallback: redirect to Paddle checkout page
          const checkoutUrl = `https://checkout.paddle.com/subscription/${productId}?email=${encodeURIComponent(user?.email || '')}`;
          window.open(checkoutUrl, '_blank');
          setIsLoading(false);
        }
      } else {
        console.log('📱 Opening Paddle checkout on mobile');
        // For mobile, open Paddle checkout in browser
        const checkoutUrl = `https://checkout.paddle.com/subscription/${productId}?email=${encodeURIComponent(user?.email || '')}`;
        
        const supported = await Linking.canOpenURL(checkoutUrl);
        if (supported) {
          await Linking.openURL(checkoutUrl);
        } else {
          Alert.alert(
            'Unable to Open Checkout',
            'Please try again or contact support for assistance.',
            [{ text: 'OK' }]
          );
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('💥 Subscription error:', error);
      Alert.alert(
        'Subscription Error',
        'There was an issue opening the checkout. Please try again.',
        [{ text: 'OK' }]
      );
      handleCheckoutError(error);
    }
  };

  return (
    <Button
      title={buttonTitle}
      onPress={handleSubscribe}
      variant={buttonVariant}
      loading={isLoading}
      disabled={disabled || isLoading}
      fullWidth
    />
  );
};

export default PaddleForm;