import React, { useEffect, useState } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import Button from '@/components/Button';
import { useUserStore } from '@/store/userStore';

interface PaddleFormProps {
  productId?: string;  // optional
  priceId?: string;    // now optional with correct default
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
      Environment: { set: (env: string) => void };
      Checkout: { open: (config: any) => void };
    };
  }
}

const PaddleForm: React.FC<PaddleFormProps> = ({
  productId = 'pro_01jyk34xa92kd6h2x3vw7sv5tf',
  priceId = 'pri_01jyk3h7eec66x5m7h31p66r8w', // Correct priceId as default
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

  // Remove pri_ prefix for URL construction
  const priceIdForUrl = priceId.replace(/^pri_/, '');

  console.log('👉 PaddleForm initialized with:');
  console.log('👉 Using priceId:', priceId);
  console.log('👉 Using productId:', productId);
  console.log('👉 Price ID for URL:', priceIdForUrl);
  console.log('👉 User email:', user?.email);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      console.log('🌐 Loading Paddle.js for web...');
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;

      script.onload = () => {
        console.log('✅ Paddle.js loaded successfully');
        if (window.Paddle) {
          console.log('🔧 Setting Paddle environment to sandbox...');
          window.Paddle.Environment.set('sandbox');

          const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_e8c70f35e280794bf86dfec199c';
          console.log('🔑 Using Paddle token:', paddleToken.substring(0, 10) + '...');

          try {
            window.Paddle.Setup({
              token: paddleToken,
              eventCallback: (data: any) => {
                console.log('📦 Paddle Event:', data);
                switch (data.name) {
                  case 'checkout.loaded':
                    console.log('🎯 Checkout loaded');
                    break;
                  case 'checkout.completed':
                    console.log('🎉 Checkout completed:', data.data);
                    handleCheckoutSuccess(data.data);
                    break;
                  case 'checkout.error':
                    console.log('💥 Checkout error:', data.data);
                    handleCheckoutError(data.data);
                    break;
                  case 'checkout.closed':
                    console.log('❌ Checkout closed');
                    setIsLoading(false);
                    break;
                  default:
                    console.log('📋 Other Paddle event:', data.name, data.data);
                }
              },
            });

            console.log('✅ Paddle Setup completed successfully');
            setPaddleLoaded(true);
          } catch (error) {
            console.error('💥 Paddle Setup failed, trying fallback:', error);
            // Fallback setup
            window.Paddle.Setup({ vendor: 33436 });
            setPaddleLoaded(true);
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
        } catch {}
      };
    }
  }, [user?.email]);

  const handleCheckoutSuccess = (data: any) => {
    console.log('🎉 Payment successful:', data);
    setPremium(true);
    Alert.alert('Success!', `Thanks for subscribing to ${productName}.`, [
      { text: 'OK', onPress: onSuccess },
    ]);
    setIsLoading(false);
  };

  const handleCheckoutError = (error: any) => {
    console.error('💥 Payment failed:', error);
    Alert.alert('Error', 'Payment failed. Please try again.', [{ text: 'OK' }]);
    onError?.(error);
    setIsLoading(false);
  };

  const handleSubscribe = async () => {
    console.log('🚀 Starting checkout process...');
    setIsLoading(true);

    try {
      if (Platform.OS === 'web') {
        if (window.Paddle && paddleLoaded) {
          console.log('💳 Opening Paddle checkout overlay...');
          const checkoutConfig = {
            items: [{ priceId }],
            customer: { email: user?.email || '' },
            customData: { 
              userId: user?.id || '', 
              productName,
              productId 
            },
            settings: { 
              displayMode: 'overlay', 
              theme: 'light' 
            },
          };
          console.log('📋 Checkout config:', checkoutConfig);
          
          window.Paddle.Checkout.open(checkoutConfig);
        } else {
          console.log('⚠️ Paddle not loaded, using fallback URL...');
          const fallbackUrl = `https://sandbox-checkout.paddle.com/checkout/price/${priceIdForUrl}?email=${encodeURIComponent(user?.email || '')}`;
          console.log('🔗 Fallback URL:', fallbackUrl);
          window.open(fallbackUrl, '_blank');
          setIsLoading(false);
        }
      } else {
        console.log('📱 Opening mobile checkout...');
        const mobileUrl = `https://sandbox-checkout.paddle.com/checkout/price/${priceIdForUrl}?email=${encodeURIComponent(user?.email || '')}`;
        console.log('🔗 Mobile URL:', mobileUrl);
        
        const supported = await Linking.canOpenURL(mobileUrl);
        if (supported) {
          await Linking.openURL(mobileUrl);
        } else {
          Alert.alert('Error', 'Unable to open browser checkout.', [{ text: 'OK' }]);
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error('💥 Checkout error:', err);
      handleCheckoutError(err);
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