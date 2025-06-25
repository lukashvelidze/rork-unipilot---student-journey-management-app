import React, { useEffect, useState } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import Button from '@/components/Button';
import { useUserStore } from '@/store/userStore';

interface PaddleFormProps {
  productId?: string;
  priceId?: string;
  productName?: string;
  price?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  buttonTitle?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'text' | 'destructive';
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
  priceId = 'pri_01jyk3h7eec66x5m7h31p66r8w',
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

  const priceIdForUrl = priceId.replace(/^pri_/, '');
  const hostedCheckoutId = 'hsc_01yourrealhostedcheckoutid'; // 🟠 Replace with your real ID

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;

      script.onload = () => {
        if (window.Paddle) {
          window.Paddle.Environment.set('sandbox');

          window.Paddle.Setup({
            token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_e8c70f35e280794bf86dfec199c',
            eventCallback: (data: any) => {
              switch (data.name) {
                case 'checkout.completed':
                  handleCheckoutSuccess(data.data);
                  break;
                case 'checkout.error':
                  handleCheckoutError(data.data);
                  break;
                case 'checkout.closed':
                  setIsLoading(false);
                  break;
              }
            },
          });

          setPaddleLoaded(true);
        }
      };

      script.onerror = () => {
        console.error('Failed to load Paddle.js');
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
    setPremium(true);
    Alert.alert('Success!', `Thanks for subscribing to ${productName}.`, [
      { text: 'OK', onPress: onSuccess },
    ]);
    setIsLoading(false);
  };

  const handleCheckoutError = (error: any) => {
    Alert.alert('Error', 'Payment failed. Please try again.', [{ text: 'OK' }]);
    onError?.(error);
    setIsLoading(false);
  };

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      const userEmail = encodeURIComponent(user?.email || '');

      if (Platform.OS === 'web') {
        if (window.Paddle && paddleLoaded) {
          window.Paddle.Checkout.open({
            items: [{ priceId }],
            customer: { email: user?.email || '' },
            customData: {
              userId: user?.id || '',
              productName,
              productId,
            },
            settings: {
              displayMode: 'overlay',
              theme: 'light',
            },
          });
        } else {
          const fallbackUrl = `https://pay.paddle.com/checkout/${hostedCheckoutId}?price_id=${priceId}&email=${userEmail}`;
          window.open(fallbackUrl, '_blank');
          setIsLoading(false);
        }
      } else {
        const mobileUrl = `https://pay.paddle.com/checkout/${hostedCheckoutId}?price_id=${priceId}&email=${userEmail}`;
        const supported = await Linking.canOpenURL(mobileUrl);
        if (supported) {
          await Linking.openURL(mobileUrl);
        } else {
          Alert.alert('Error', 'Unable to open browser checkout.', [{ text: 'OK' }]);
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
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
