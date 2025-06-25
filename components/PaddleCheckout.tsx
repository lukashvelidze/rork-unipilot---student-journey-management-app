import React, { useState, useRef } from "react";
import { View, Modal, TouchableOpacity, Text, StyleSheet, Platform, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { usePaddle } from "@/hooks/usePaddle";

interface PaddleCheckoutProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCancel: () => void;
  customerEmail?: string;
  userId?: string;
}

export default function PaddleCheckout({
  visible,
  onClose,
  onSuccess,
  onCancel,
  customerEmail = "user@example.com",
  userId = "anonymous",
}: PaddleCheckoutProps) {
  const { openCheckout, isReady } = usePaddle();
  const webViewRef = useRef<WebView>(null);

  // Web implementation using Paddle.js
  const handleWebCheckout = () => {
    if (!isReady) {
      Alert.alert("Error", "Payment system is not ready. Please try again.");
      return;
    }

    openCheckout({
      customer: {
        email: customerEmail,
      },
      customData: {
        userId: userId,
      },
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl: "https://unipilot.app/success",
      },
    });

    // Listen for Paddle events
    if (typeof window !== 'undefined') {
      const handlePaddleEvent = (event: any) => {
        if (event.name === 'checkout.completed') {
          onSuccess();
          onClose();
        } else if (event.name === 'checkout.closed') {
          onCancel();
          onClose();
        }
      };

      // Add event listener (this is pseudo-code, actual implementation may vary)
      // paddle.on('checkout.completed', handlePaddleEvent);
      // paddle.on('checkout.closed', handlePaddleEvent);
    }
  };

  // Mobile implementation using WebView with embedded Paddle.js
  const paddleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>UniPilot Premium Checkout</title>
      <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 8px;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #6b7280;
          margin-bottom: 24px;
        }
        .price {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 24px;
        }
        .checkout-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          margin-bottom: 16px;
        }
        .checkout-btn:hover {
          background: #5856eb;
        }
        .checkout-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }
        .cancel-btn {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
        }
        .loading {
          color: #6b7280;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">👑 UniPilot</div>
        <div class="title">Premium Subscription</div>
        <div class="subtitle">Unlock all premium features</div>
        <div class="price">$4.99/month</div>
        
        <button id="checkout-btn" class="checkout-btn" onclick="startCheckout()">
          Subscribe Now
        </button>
        
        <button class="cancel-btn" onclick="cancelCheckout()">
          Cancel
        </button>
        
        <div id="status" class="loading" style="display: none;">
          Initializing payment system...
        </div>
      </div>

      <script>
        let paddle;
        let isReady = false;

        // Initialize Paddle
        Paddle.Setup({
          environment: 'sandbox',
          token: 'test_e8c70f35e280794bf86dfec199c'
        });

        Paddle.Initialize({
          environment: 'sandbox',
          token: 'test_e8c70f35e280794bf86dfec199c'
        }).then((p) => {
          console.log('✅ Paddle initialized');
          paddle = p;
          isReady = true;
          document.getElementById('status').style.display = 'none';
        }).catch((error) => {
          console.error('❌ Paddle initialization failed:', error);
          document.getElementById('status').textContent = 'Payment system unavailable';
          document.getElementById('checkout-btn').disabled = true;
        });

        function startCheckout() {
          if (!isReady || !paddle) {
            alert('❌ Payment system not ready yet');
            return;
          }

          document.getElementById('checkout-btn').disabled = true;
          document.getElementById('checkout-btn').textContent = 'Processing...';

          paddle.Checkout.open({
            items: [{ 
              priceId: 'pri_01jyk3h7eec66x5m7h31p66r8w', 
              quantity: 1 
            }],
            customer: {
              email: '${customerEmail}'
            },
            customData: {
              userId: '${userId}'
            },
            settings: {
              displayMode: 'overlay',
              theme: 'light',
              successUrl: 'https://unipilot.app/success'
            }
          });

          // Listen for checkout events
          paddle.Checkout.onComplete((data) => {
            console.log('✅ Checkout completed:', data);
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'checkout_success',
              data: data
            }));
          });

          paddle.Checkout.onClose(() => {
            console.log('❌ Checkout closed');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'checkout_cancelled'
            }));
          });
        }

        function cancelCheckout() {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'checkout_cancelled'
          }));
        }

        // Show loading initially
        document.getElementById('status').style.display = 'block';
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'checkout_success':
          console.log('✅ Checkout successful:', message.data);
          onSuccess();
          onClose();
          break;
        case 'checkout_cancelled':
          console.log('❌ Checkout cancelled');
          onCancel();
          onClose();
          break;
        default:
          console.log('Unknown message:', message);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  if (Platform.OS === 'web') {
    // On web, trigger Paddle.js directly
    React.useEffect(() => {
      if (visible && isReady) {
        handleWebCheckout();
      }
    }, [visible, isReady]);

    return null; // Paddle overlay handles the UI on web
  }

  // Mobile implementation with WebView
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Your Subscription</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <WebView
          ref={webViewRef}
          source={{ html: paddleHtml }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
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
  },
  webview: {
    flex: 1,
  },
});