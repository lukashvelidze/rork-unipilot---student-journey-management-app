import React, { useState, useRef, useEffect } from "react";
import { View, Modal, TouchableOpacity, Text, StyleSheet, Platform, Alert, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { X, Shield, Zap, Crown } from "lucide-react-native";
import Colors from "@/constants/colors";
import { usePaddle } from "@/hooks/usePaddle";
import { createCheckoutUrl } from "@/lib/paddle";
import { useUserStore } from "@/store/userStore";

// Add CSS for web spinner animation
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const existingStyle = document.getElementById('paddle-spinner-styles');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'paddle-spinner-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .spinner-animation {
        animation: spin 1s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }
}

const { width, height } = Dimensions.get('window');

interface PaddleCheckoutProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCancel: () => void;
  customerEmail?: string;
  userId?: string;
  priceId?: string;
}

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
  const webViewRef = useRef<WebView>(null);
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { user } = useUserStore();

  // For web platform, use direct Paddle integration
  const handleWebCheckout = async () => {
    if (!isReady) {
      Alert.alert("Error", "Payment system is not ready. Please try again.");
      return;
    }

    setCheckoutStarted(true);
    setPaymentProcessing(true);

    try {
      await openCheckout({
        priceId,
        customer: { email: customerEmail || user?.email || '' },
        customData: { userId: userId || user?.id || 'anonymous' },
      });
    } catch (error) {
      console.error('Web checkout error:', error);
      setPaymentProcessing(false);
      setCheckoutStarted(false);
    }
  };

  // Generate checkout URL for mobile WebView
  const checkoutUrl = createCheckoutUrl({
    priceId,
    customerEmail: customerEmail || user?.email || '',
    userId: userId || user?.id || 'anonymous',
  });

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'checkout_success':
          console.log('✅ Checkout successful:', message.data);
          setPaymentProcessing(false);
          onSuccess();
          onClose();
          break;
        case 'checkout_closed':
        case 'checkout_cancelled':
          console.log('❌ Checkout cancelled');
          setPaymentProcessing(false);
          setCheckoutStarted(false);
          onCancel();
          break;
        case 'checkout_error':
          console.error('❌ Checkout error:', message.error);
          setPaymentProcessing(false);
          setCheckoutStarted(false);
          Alert.alert(
            'Payment Error',
            'There was an issue processing your payment. Please try again.',
            [{ text: 'OK' }]
          );
          break;
        default:
          console.log('Unknown message:', message);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Reset state when modal is closed
  useEffect(() => {
    if (!visible) {
      setCheckoutStarted(false);
      setPaymentProcessing(false);
    }
  }, [visible]);

  if (Platform.OS === 'web') {
    // Web implementation with native Paddle checkout
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.webOverlay}>
          <View style={styles.webContainer}>
            <View style={styles.webHeader}>
              <Text style={styles.webTitle}>UniPilot Premium</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            {!checkoutStarted ? (
              <View style={styles.webContent}>
                <View style={styles.premiumBadge}>
                  <Crown size={32} color={Colors.premium} />
                </View>
                
                <Text style={styles.webSubtitle}>
                  Unlock premium features and accelerate your study abroad journey
                </Text>
                
                <View style={styles.featuresList}>
                  <View style={styles.feature}>
                    <Zap size={16} color={Colors.success} />
                    <Text style={styles.featureText}>Unlimited AI assistance</Text>
                  </View>
                  <View style={styles.feature}>
                    <Shield size={16} color={Colors.success} />
                    <Text style={styles.featureText}>Priority support</Text>
                  </View>
                  <View style={styles.feature}>
                    <Zap size={16} color={Colors.success} />
                    <Text style={styles.featureText}>Advanced analytics</Text>
                  </View>
                </View>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>$4.99</Text>
                  <Text style={styles.period}>/month</Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.checkoutButton, { opacity: isReady ? 1 : 0.5 }]}
                  onPress={handleWebCheckout}
                  disabled={!isReady || isLoading}
                >
                  <Text style={styles.checkoutButtonText}>
                    {isLoading ? 'Loading...' : 'Start Premium Subscription'}
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.secureText}>🎭 Demo payment system (Paddle removed)</Text>
              </View>
            ) : (
              <View style={styles.processingContainer}>
                <View 
                  style={styles.spinner} 
                  {...(Platform.OS === 'web' && { className: 'spinner-animation' })}
                />
                <Text style={styles.processingText}>
                  {paymentProcessing ? 'Processing payment...' : 'Loading checkout...'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // Mobile implementation with enhanced WebView
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Premium Subscription</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          onLoadStart={() => console.log('WebView loading started')}
          onLoadEnd={() => console.log('WebView loading ended')}
          onError={(error) => {
            console.error('WebView error:', error);
            Alert.alert(
              'Loading Error',
              'Failed to load payment form. Please try again.',
              [{ text: 'OK', onPress: onClose }]
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
  },
  webview: {
    flex: 1,
  },
  // Web-specific styles
  webOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webContainer: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    maxWidth: 480,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  webHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  webContent: {
    padding: 30,
    alignItems: 'center',
  },
  premiumBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.premiumBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  webSubtitle: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 30,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 30,
  },
  price: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
  },
  period: {
    fontSize: 18,
    color: Colors.lightText,
    marginLeft: 4,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'stretch',
    marginBottom: 15,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  checkoutButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secureText: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
  },
  processingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: Colors.lightBackground,
    borderTopColor: Colors.primary,
    marginBottom: 20,
    ...Platform.select({
      web: {
        // CSS animation handled via CSS class
      },
    }),
  },
  processingText: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: 'center',
  },
});