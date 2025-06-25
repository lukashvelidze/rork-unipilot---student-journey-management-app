import React, { useEffect, useState } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { initializePaddle, Paddle, CheckoutOpenOptions } from '@paddle/paddle-js';
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
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [paddleError, setPaddleError] = useState<string | null>(null);

  // Remove 'pri_' prefix for URL usage
  const priceIdForUrl = priceId.replace(/^pri_/, '');
  
  // Hosted checkout ID for fallback (replace with your real ID)
  const hostedCheckoutId = 'hsc_01yourrealhostedcheckoutid';

  useEffect(() => {
    console.log('👉 Initializing Paddle with priceId:', priceId);
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const initPaddle = async () => {
        try {
          const paddleInstance = await initializePaddle({
            environment: 'sandbox',
            token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_e8c70f35e280794bf86dfec199c',
            eventCallback: (data) => {
              console.log('🎯 Paddle Event:', data.name, data.data);
              
              switch (data.name) {
                case 'checkout.completed':
                  console.log('✅ Checkout completed:', data.data);
                  handleCheckoutSuccess(data.data);
                  break;
                case 'checkout.error':
                  console.log('❌ Checkout error:', data.data);
                  handleCheckoutError(data.data);
                  break;
                case 'checkout.closed':
                  console.log('🚪 Checkout closed');
                  setIsLoading(false);
                  break;
                case 'checkout.loaded':
                  console.log('📦 Checkout loaded');
                  break;
                default:
                  console.log('📡 Other Paddle event:', data.name);
              }
            },
          });

          if (paddleInstance) {
            setPaddle(paddleInstance);
            console.log('✅ Paddle initialized successfully');
          } else {
            throw new Error('Failed to initialize Paddle');
          }
        } catch (error) {
          console.error('❌ Failed to initialize Paddle:', error);
          setPaddleError('Failed to load payment system');
        }
      };

      initPaddle();
    }
  }, [user?.email, priceId]);

  const handleCheckoutSuccess = (data: any) => {
    console.log('🎉 Payment successful, setting premium status');
    setPremium(true);
    Alert.alert('Success!', `Thanks for subscribing to ${productName}.`, [
      { text: 'OK', onPress: onSuccess },
    ]);
    setIsLoading(false);
  };

  const handleCheckoutError = (error: any) => {
    console.error('💥 Payment error:', error);
    Alert.alert('Error', 'Payment failed. Please try again.', [{ text: 'OK' }]);
    onError?.(error);
    setIsLoading(false);
  };

  const handleSubscribe = async () => {
    console.log('🚀 Starting checkout process...');
    setIsLoading(true);

    try {
      const userEmail = encodeURIComponent(user?.email || '');

      if (Platform.OS === 'web') {
        if (paddle) {
          console.log('💳 Opening Paddle checkout with:', {
            priceId,
            email: user?.email,
            productName,
          });

          const checkoutOptions: CheckoutOpenOptions = {
            items: [{ priceId, quantity: 1 }],
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
          };

          paddle.Checkout.open(checkoutOptions);
        } else {
          console.log('⚠️ Paddle not loaded, using fallback URL');
          const fallbackUrl = `https://sandbox-checkout.paddle.com/checkout/price/${priceIdForUrl}?email=${userEmail}`;
          window.open(fallbackUrl, '_blank');
          setIsLoading(false);
        }
      } else {
        // Mobile fallback
        console.log('📱 Opening mobile checkout URL');
        const mobileUrl = `https://sandbox-checkout.paddle.com/checkout/price/${priceIdForUrl}?email=${userEmail}`;
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

  // Show error state if Paddle failed to load on web
  if (Platform.OS === 'web' && paddleError) {
    return (
      <Button
        title="Payment System Unavailable"
        onPress={() => Alert.alert('Error', paddleError)}
        variant="outline"
        disabled={true}
        fullWidth
      />
    );
  }

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