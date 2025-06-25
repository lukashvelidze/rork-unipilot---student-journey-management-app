import { useEffect, useState } from "react";
import { Platform } from "react-native";

// Web-only Paddle hook
export const usePaddle = () => {
  const [paddle, setPaddle] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const initializePaddle = async () => {
      try {
        const { initializePaddle } = await import("@paddle/paddle-js");
        
        const paddleInstance = await initializePaddle({
          environment: "sandbox",
          token: "test_e8c70f35e280794bf86dfec199c",
        });

        console.log("✅ Paddle initialized");
        setPaddle(paddleInstance);
        setIsReady(true);
      } catch (error) {
        console.error("❌ Failed to initialize Paddle:", error);
      }
    };

    initializePaddle();
  }, []);

  const openCheckout = (options: any) => {
    if (!paddle || !isReady) {
      console.warn("❌ Paddle not ready yet");
      return;
    }

    paddle.Checkout.open({
      items: [{ priceId: "pri_01jyk3h7eec66x5m7h31p66r8w", quantity: 1 }],
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl: options.successUrl || "https://unipilot.app/success",
        ...options.settings,
      },
      ...options,
    });
  };

  return {
    paddle,
    isReady,
    openCheckout,
  };
};