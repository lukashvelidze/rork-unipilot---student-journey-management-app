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
  
  console.log('👉 PaddleForm initialized with priceId:', priceId);
  console.log('👉 Price ID for URL (without prefix):', priceIdForUrl);

  useEffect(() => {
    console.log('🔧 Initializing Paddle with environment: sandbox');
    console.log('🔧 Using client token:', process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.substring(0, 10) + '...');
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const initPaddle = async () => {
        try {
          const paddleInstance = await initializePaddle({
            environment: 'sandbox', // Use 'production' for live environment
            token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_e8c70f35e280794bf86dfec199c',
            eventCallback: (data) => {
              console.log('🎯 Paddle Event:', data.name, data.data);
              
              switch (data.name) {
                case 'checkout.loaded':
                  console.log('📦 Checkout loaded successfully');
                  break;
                case 'checkout.completed':
                  console.log('✅ Checkout completed:', data.data);
                  handleCheckoutSuccess(data.data);
                  break;
                case 'checkout.error':
                  console.log('❌ Checkout error:', data.data);
                  handleCheckoutError(data.data);
                  break;
                case 'checkout.closed':
                  console.log('🚪 Checkout closed by user');
                  setIsLoading(false);
                  break;
                default:
                  console.log('📡 Other Paddle event:', data.name, data.data);
              }
            },
          });

          if (paddleInstance) {
            setPaddle(paddleInstance);
            console.log('✅ Paddle initialized successfully');
          } else {
            throw new Error('Failed to initialize Paddle - instance is null');
          }
        } catch (error) {
          console.error('❌ Failed to initialize Paddle:', error);
          setPaddleError('Failed to load payment system. Please refresh and try again.');
        }
      };

      initPaddle();
    } else {
      console.log('📱 Running on mobile - Paddle.js will use fallback URLs');
    }
  }, []);

  const handleCheckoutSuccess = (data: any) => {
    console.log('🎉 Payment successful! Setting premium status...');
    console.log('🎉 Success data:', data);
    
    // Set premium status immediately
    setPremium(true);
    
    // Show success message
    Alert.alert(
      'Welcome to Premium!', 
      `Thank you for subscribing to ${productName}. You now have access to all premium features.`,
      [
        { 
          text: 'Explore Premium Features', 
          onPress: () => {
            setIsLoading(false);
            onSuccess?.();
          }
        },
      ]
    );
  };

  const handleCheckoutError = (error: any) => {
    console.error('💥 Payment error:', error);
    setIsLoading(false);
    
    const errorMessage = error?.message || error?.error || 'Payment failed. Please try again.';
    Alert.alert(
      'Payment Error', 
      errorMessage,
      [{ text: 'OK' }]
    );
    
    onError?.(error);
  };

  const handleSubscribe = async () => {
    console.log('🚀 Starting checkout process...');
    console.log('🚀 User email:', user?.email);
    console.log('🚀 Product details:', { productId, priceId, productName });
    
    setIsLoading(true);

    try {
      if (Platform.OS === 'web') {
        if (paddle) {
          console.log('💳 Opening Paddle checkout overlay...');

          const checkoutOptions: CheckoutOpenOptions = {
            items: [{ 
              priceId: priceId, 
              quantity: 1 
            }],
            customer: { 
              email: user?.email || '' 
            },
            customData: {
              userId: user?.id || '',
              productName: productName,
              productId: productId,
            },
            settings: {
              displayMode: 'overlay',
              theme: 'light',
              locale: 'en',
              allowLogout: false,
            },
          };

          console.log('💳 Checkout options:', checkoutOptions);
          paddle.Checkout.open(checkoutOptions);
        } else {
          console.log('⚠️ Paddle not loaded, using fallback URL...');
          // Fallback to hosted checkout page
          const userEmail = encodeURIComponent(user?.email || '');
          const fallbackUrl = `https://pay.paddle.com/checkout/price/${priceIdForUrl}?user_email=${userEmail}`;
          console.log('🔗 Fallback URL:', fallbackUrl);
          
          window.open(fallbackUrl, '_blank');
          setIsLoading(false);
        }
      } else {
        // Mobile fallback - open hosted checkout in browser
        console.log('📱 Opening mobile checkout URL...');
        const userEmail = encodeURIComponent(user?.email || '');
        const mobileUrl = `https://pay.paddle.com/checkout/price/${priceIdForUrl}?user_email=${userEmail}`;
        console.log('🔗 Mobile URL:', mobileUrl);
        
        const supported = await Linking.canOpenURL(mobileUrl);
        if (supported) {
          await Linking.openURL(mobileUrl);
        } else {
          Alert.alert(
            'Error', 
            'Unable to open browser for checkout. Please try again.',
            [{ text: 'OK' }]
          );
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
        onPress={() => Alert.alert('Error', paddleError + '\n\nPlease refresh the page and try again.')}
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