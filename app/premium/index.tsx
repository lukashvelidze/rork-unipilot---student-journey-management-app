import React, { useState } from 'react';
import { View, Button, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PremiumScreen({ user }) {
  const [showCheckout, setShowCheckout] = useState(false);
  const email = encodeURIComponent(user?.email || "test@example.com");

  const checkoutUrl = `https://lukashvelidze.github.io/unipilot/checkout.html?email=${email}`;

  if (showCheckout) {
    return <WebView source={{ uri: checkoutUrl }} />;
  }

  return (
    <View>
      <Button title="Subscribe" onPress={() => setShowCheckout(true)} />
    </View>
  );
}