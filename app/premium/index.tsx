import { WebView } from 'react-native-webview';
import React, { useState } from 'react';
import { Platform, Button } from 'react-native';

export default function PremiumScreen({ user }) {
  const [showCheckout, setShowCheckout] = useState(false);

  const email = user?.email || "test@example.com";
  const checkoutUrl = `https://lukashvelidze.github.io/unipilot/checkout.html?email=${encodeURIComponent(email)}`;

  if (showCheckout && Platform.OS !== 'web') {
    return (
      <WebView
        source={{ uri: checkoutUrl }}
        startInLoadingState
        javaScriptEnabled
        onNavigationStateChange={(navState) => {
          // ✅ Listen for success URL
          if (navState.url.includes("success=true")) {
            setShowCheckout(false);           // ✅ Close WebView
            setPremium(true); 
            // You can also navigate or show a toast here
          }
        }}
      />
    );
  }

  const handleSubscribe = () => {
    if (Platform.OS === 'web') {
      window.open(checkoutUrl, "_blank");
    } else {
      setShowCheckout(true); // Show in-app WebView
    }
  };

  return (
    <>
      {/* Your existing premium UI here */}
      <Button title="Subscribe to Premium" onPress={handleSubscribe} />
    </>
  );
}
