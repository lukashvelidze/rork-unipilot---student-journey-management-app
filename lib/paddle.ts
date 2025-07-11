import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { Platform } from 'react-native';

let paddleInstance: Paddle | null = null;

export const initializePaddleService = async (): Promise<Paddle | null> => {
  try {
    if (paddleInstance) {
      return paddleInstance;
    }

    // Initialize Paddle for both web and mobile
    const paddle = await initializePaddle({
      environment: 'sandbox', // Use 'production' for live environment
      token: 'test_c25cc3df5ddfcd6b3b2a8420700',
    });
    
    paddleInstance = paddle || null;
    console.log('✅ Paddle initialized successfully for', Platform.OS);

    return paddleInstance;
  } catch (error) {
    console.error('Failed to initialize Paddle:', error);
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
      throw new Error('Paddle not initialized');
    }

    const {
      priceId = 'pri_01jyk3h7eec66x5m7h31p66r8w',
      customerEmail = '',
      userId = 'anonymous',
      onSuccess,
      onError,
      onClose
    } = options;

    // For web, use embedded checkout
    if (Platform.OS === 'web') {
      try {
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: {
            email: customerEmail,
          },
          customData: {
            userId,
            app: 'unipilot',
            platform: Platform.OS,
          },
          settings: {
            displayMode: 'inline',
            theme: 'light',
            locale: 'en',
            allowDiscountRemoval: false,
          }
        });

        // Return success indicator for web
        return { success: true, platform: 'web' };
      } catch (error) {
        console.error('Failed to open web checkout:', error);
        throw error;
      }
    } else {
      // For mobile, return checkout configuration for WebView
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
    console.error('Failed to open embedded checkout:', error);
    throw error;
  }
};

// Legacy function - kept for backwards compatibility
export const openPaddleCheckout = async (priceId: string = 'pri_01jyk3h7eec66x5m7h31p66r8w') => {
  return openEmbeddedCheckout('paddle-checkout', { priceId });
};

export const getPaddleInstance = (): Paddle | null => {
  return paddleInstance;
};

// Utility function to create checkout URL for WebView
export const createCheckoutUrl = (options: {
  priceId?: string;
  customerEmail?: string;
  userId?: string;
}) => {
  const {
    priceId = 'pri_01jyk3h7eec66x5m7h31p66r8w',
    customerEmail = '',
    userId = 'anonymous'
  } = options;

  return `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
      <title>UniPilot Premium</title>
      <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
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
        .loading {
          color: #718096;
          font-style: italic;
          margin-top: 20px;
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
        .status-error {
          background: #fed7d7;
          border: 1px solid #fc8181;
          color: #742a2a;
          padding: 15px;
          border-radius: 10px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
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
        
        <button id="checkout-btn" class="checkout-btn" onclick="startCheckout()">
          <span id="btn-text">Subscribe Now</span>
        </button>
        
        <button class="cancel-btn" onclick="cancelCheckout()">
          Cancel
        </button>
        
        <div id="status" class="loading" style="display: none;">
          <div class="spinner"></div>
          Initializing secure payment...
        </div>
        
        <div id="checkout-container" style="display: none;"></div>
      </div>

      <script>
        let paddle;
        let isReady = false;
        let checkoutInstance = null;

        // Initialize Paddle
        Paddle.Setup({
          environment: 'sandbox',
          token: 'test_c25cc3df5ddfcd6b3b2a8420700'
        });

        Paddle.Initialize({
          environment: 'sandbox',
          token: 'test_c25cc3df5ddfcd6b3b2a8420700'
        }).then((p) => {
          console.log('✅ Paddle initialized');
          paddle = p;
          isReady = true;
          document.getElementById('status').style.display = 'none';
          document.getElementById('checkout-btn').disabled = false;
        }).catch((error) => {
          console.error('❌ Paddle initialization failed:', error);
          showError('Payment system unavailable. Please try again later.');
        });

        function showError(message) {
          const container = document.querySelector('.container');
          const errorDiv = document.createElement('div');
          errorDiv.className = 'status-error';
          errorDiv.textContent = message;
          container.appendChild(errorDiv);
          document.getElementById('checkout-btn').disabled = true;
        }

        function showSuccess(message) {
          const container = document.querySelector('.container');
          const successDiv = document.createElement('div');
          successDiv.className = 'status-success';
          successDiv.textContent = message;
          container.appendChild(successDiv);
        }

        function startCheckout() {
          if (!isReady || !paddle) {
            showError('Payment system not ready yet. Please wait...');
            return;
          }

          const btn = document.getElementById('checkout-btn');
          const btnText = document.getElementById('btn-text');
          
          btn.disabled = true;
          btnText.innerHTML = '<div class="spinner"></div>Processing...';

          try {
            checkoutInstance = paddle.Checkout.open({
              items: [{ 
                priceId: '${priceId}', 
                quantity: 1 
              }],
              customer: {
                email: '${customerEmail}'
              },
              customData: {
                userId: '${userId}',
                app: 'unipilot',
                platform: 'mobile'
              },
              settings: {
                displayMode: 'overlay',
                theme: 'light',
                locale: 'en',
                allowDiscountRemoval: false,
                showAddDiscounts: true,
                showAddTaxId: false
              }
            });

            // Handle checkout events
            checkoutInstance.onComplete((data) => {
              console.log('✅ Checkout completed:', data);
              showSuccess('Payment successful! Redirecting...');
              setTimeout(() => {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'checkout_success',
                  data: data
                }));
              }, 1500);
            });

            checkoutInstance.onClose(() => {
              console.log('❌ Checkout closed');
              btn.disabled = false;
              btnText.textContent = 'Subscribe Now';
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'checkout_closed'
              }));
            });

            checkoutInstance.onError((error) => {
              console.error('❌ Checkout error:', error);
              btn.disabled = false;
              btnText.textContent = 'Subscribe Now';
              showError('Payment failed. Please try again.');
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'checkout_error',
                error: error
              }));
            });

          } catch (error) {
            console.error('❌ Failed to open checkout:', error);
            btn.disabled = false;
            btnText.textContent = 'Subscribe Now';
            showError('Failed to open payment. Please try again.');
          }
        }

        function cancelCheckout() {
          if (checkoutInstance) {
            checkoutInstance.close();
          }
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'checkout_cancelled'
          }));
        }

        // Show loading initially
        document.getElementById('status').style.display = 'block';
        document.getElementById('checkout-btn').disabled = true;
      </script>
    </body>
    </html>
  `)}`;
};