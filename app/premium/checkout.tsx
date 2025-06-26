import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";
import { useUserStore } from "@/store/userStore";

export default function PaddleCheckoutScreen() {
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const { setPremium } = useUserStore();
  
  const userEmail = email || "test@example.com";
  const checkoutUrl = `https://checkout.paddle.com/subscription/pro_01jyk34xa92kd6h2x3vw7sv5tf?email=${encodeURIComponent(userEmail as string)}`;

  const handleNavigationStateChange = (navState: any) => {
    // Check if user completed the checkout successfully
    if (navState.url.includes('success') || navState.url.includes('checkout-complete')) {
      // Set premium status
      setPremium(true);
      
      // Navigate back to premium screen
      router.replace('/premium');
    }
    
    // Handle cancellation
    if (navState.url.includes('cancel') || navState.url.includes('checkout-cancel')) {
      router.back();
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'checkout_complete') {
        setPremium(true);
        router.replace('/premium');
      } else if (data.type === 'checkout_cancel') {
        router.back();
      }
    } catch (error) {
      console.log('WebView message parsing error:', error);
    }
  };

  if (Platform.OS === 'web') {
    // For web, redirect to external checkout
    React.useEffect(() => {
      window.open(checkoutUrl, '_blank');
      router.back();
    }, []);
    
    return null;
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: checkoutUrl }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
        style={styles.webview}
        // Allow the WebView to handle redirects
        onShouldStartLoadWithRequest={(request) => {
          return true;
        }}
        // Inject JavaScript to communicate with the parent app
        injectedJavaScript={`
          // Listen for Paddle checkout events
          if (window.Paddle) {
            window.Paddle.Setup({
              checkout: {
                settings: {
                  successUrl: 'about:blank?success=true',
                  closeUrl: 'about:blank?cancel=true'
                }
              }
            });
          }
          
          // Listen for URL changes that indicate completion
          let lastUrl = window.location.href;
          setInterval(() => {
            if (window.location.href !== lastUrl) {
              lastUrl = window.location.href;
              if (lastUrl.includes('success') || lastUrl.includes('complete')) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'checkout_complete'
                }));
              } else if (lastUrl.includes('cancel') || lastUrl.includes('close')) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'checkout_cancel'
                }));
              }
            }
          }, 1000);
          
          true;
        `}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});