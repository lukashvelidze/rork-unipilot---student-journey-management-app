import { Platform } from 'react-native';

// Dummy Paddle interface for type compatibility
interface DummyPaddle {
  Checkout: {
    open: (options: any) => void;
  };
}

let paddleInstance: DummyPaddle | null = null;

export const initializePaddleService = async (): Promise<DummyPaddle | null> => {
  try {
    if (paddleInstance) {
      return paddleInstance;
    }

    // Create dummy Paddle instance
    const dummyPaddle: DummyPaddle = {
      Checkout: {
        open: (options: any) => {
          console.log('🎭 Dummy Paddle checkout opened with options:', options);
          // Simulate successful payment after 2 seconds
          setTimeout(() => {
            console.log('✅ Dummy payment successful!');
            // You can add any success handling here
          }, 2000);
        }
      }
    };
    
    paddleInstance = dummyPaddle;
    console.log('✅ Dummy Paddle initialized successfully for', Platform.OS);

    return paddleInstance;
  } catch (error) {
    console.error('Failed to initialize dummy Paddle:', error);
    return null;
  }
};

export const openEmbeddedCheckout = async (
  containerId: string,
  options: {
    priceId?: string;
    customerEmail?: string;
    userId?: string;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    onClose?: () => void;
  } = {}
) => {
  try {
    const paddle = await initializePaddleService();
    
    if (!paddle) {
      throw new Error('Dummy Paddle not initialized');
    }

    const {
      priceId = 'dummy_price_123',
      customerEmail = '',
      userId = 'anonymous',
      onSuccess,
      onError,
      onClose
    } = options;

    console.log('🎭 Opening dummy checkout with options:', { priceId, customerEmail, userId });

    // Simulate successful payment after 1 second
    setTimeout(() => {
      console.log('✅ Dummy payment successful!');
      if (onSuccess) {
        onSuccess({
          transactionId: 'dummy_txn_' + Date.now(),
          status: 'completed',
          amount: 4.99,
          currency: 'USD'
        });
      }
    }, 1000);

    // For web, return success indicator
    if (Platform.OS === 'web') {
      return { success: true, platform: 'web' };
    } else {
      // For mobile, return dummy checkout configuration
      return {
        items: [{ priceId, quantity: 1 }],
        customer: { email: customerEmail },
        customData: { userId, app: 'unipilot', platform: Platform.OS },
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
        }
      };
    }
  } catch (error) {
    console.error('Failed to open dummy checkout:', error);
    throw error;
  }
};

// Legacy function - kept for backwards compatibility
export const openPaddleCheckout = async (priceId: string = 'dummy_price_123') => {
  return openEmbeddedCheckout('paddle-checkout', { priceId });
};

export const getPaddleInstance = (): DummyPaddle | null => {
  return paddleInstance;
};

// Utility function to create dummy checkout URL for WebView
export const createCheckoutUrl = (options: {
  priceId?: string;
  customerEmail?: string;
  userId?: string;
}) => {
  const {
    priceId = 'dummy_price_123',
    customerEmail = '',
    userId = 'anonymous'
  } = options;

  return `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
      <title>UniPilot Premium - Demo Mode</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px 30px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 400px;
          width: 100%;
          position: relative;
          overflow: hidden;
        }
        .container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }
        .demo-badge {
          background: #ff6b6b;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 20px;
          display: inline-block;
        }
        .logo {
          font-size: 32px;
          margin-bottom: 10px;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #718096;
          font-size: 16px;
          margin-bottom: 30px;
          line-height: 1.5;
        }
        .price-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 30px;
          color: white;
        }
        .price {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 5px;
        }
        .period {
          font-size: 14px;
          opacity: 0.9;
        }
        .features {
          text-align: left;
          margin-bottom: 30px;
        }
        .feature {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
          color: #4a5568;
        }
        .feature::before {
          content: '✓';
          color: #48bb78;
          font-weight: bold;
          margin-right: 10px;
          font-size: 16px;
        }
        .checkout-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          margin-bottom: 15px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .checkout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .checkout-btn:disabled {
          background: #e2e8f0;
          color: #a0aec0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .cancel-btn {
          background: transparent;
          color: #718096;
          border: 2px solid #e2e8f0;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s;
        }
        .cancel-btn:hover {
          border-color: #cbd5e0;
          background: #f7fafc;
        }
        .spinner {
          border: 2px solid #e2e8f0;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .status-success {
          background: #f0fff4;
          border: 1px solid #68d391;
          color: #276749;
          padding: 15px;
          border-radius: 10px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="demo-badge">DEMO MODE</div>
        <div class="logo">👑</div>
        <div class="title">UniPilot Premium</div>
        <div class="subtitle">Unlock your full potential with premium features</div>
        
        <div class="price-container">
          <div class="price">$4.99</div>
          <div class="period">per month</div>
        </div>
        
        <div class="features">
          <div class="feature">Unlimited AI assistance</div>
          <div class="feature">Priority support</div>
          <div class="feature">Advanced analytics</div>
          <div class="feature">Exclusive content</div>
          <div class="feature">Early access to features</div>
        </div>
        
        <button id="checkout-btn" class="checkout-btn" onclick="startDummyCheckout()">
          <span id="btn-text">Try Demo Payment</span>
        </button>
        
        <button class="cancel-btn" onclick="cancelCheckout()">
          Cancel
        </button>
        
        <div id="status" style="display: none;"></div>
      </div>

      <script>
        function startDummyCheckout() {
          const btn = document.getElementById('checkout-btn');
          const btnText = document.getElementById('btn-text');
          const status = document.getElementById('status');
          
          btn.disabled = true;
          btnText.innerHTML = '<div class="spinner"></div>Processing...';
          status.style.display = 'block';
          status.innerHTML = '<div class="spinner"></div>Simulating payment...';

          // Simulate payment processing
          setTimeout(() => {
            status.innerHTML = '<div class="status-success">✅ Demo payment successful! This is a simulation.</div>';
            btnText.textContent = 'Payment Complete';
            
            // Send success message to React Native
            setTimeout(() => {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'checkout_success',
                data: {
                  transactionId: 'demo_txn_' + Date.now(),
                  status: 'completed',
                  amount: 4.99,
                  currency: 'USD'
                }
              }));
            }, 1000);
          }, 2000);
        }

        function cancelCheckout() {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'checkout_cancelled'
          }));
        }
      </script>
    </body>
    </html>
  `)}`;
};