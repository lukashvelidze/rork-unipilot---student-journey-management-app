import { InteractionManager, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import * as IAP from "react-native-iap";
import type { ProductSubscription, Purchase, PurchaseError } from "react-native-iap";
export type AppleSubscriptionTier = "basic" | "standard" | "pro";

type AppStoreConfig = {
  products?: {
    basic?: string;
    standard?: string;
    pro?: string;
  };
};

const getAppStoreConfig = (): AppStoreConfig => {
  const extra =
    Constants.expoConfig?.extra ??
    (Constants.manifest as { extra?: Record<string, any> } | null)?.extra ??
    {};
  return (extra.appStore ?? {}) as AppStoreConfig;
};

const appStoreConfig = getAppStoreConfig();
const appStoreProducts = appStoreConfig.products ?? {};

const DEFAULT_APPLE_PRODUCTS = {
  basic: "unipilot_basic_monthly",
  standard: "unipilot_standard_monthly",
  pro: "unipilot_premium_monthly",
} as const;

export const APPLE_PRODUCT_IDS = [
  appStoreProducts.basic || process.env.EXPO_PUBLIC_APP_STORE_PRODUCT_ID_BASIC || DEFAULT_APPLE_PRODUCTS.basic,
  appStoreProducts.standard || process.env.EXPO_PUBLIC_APP_STORE_PRODUCT_ID_STANDARD || DEFAULT_APPLE_PRODUCTS.standard,
  appStoreProducts.pro || process.env.EXPO_PUBLIC_APP_STORE_PRODUCT_ID_PRO || DEFAULT_APPLE_PRODUCTS.pro,
] as const;

export const APPLE_SUBSCRIPTION_PRODUCTS: Record<AppleSubscriptionTier, { productId: string }> = {
  basic: { productId: APPLE_PRODUCT_IDS[0] },
  standard: { productId: APPLE_PRODUCT_IDS[1] },
  pro: { productId: APPLE_PRODUCT_IDS[2] },
};

const PRODUCT_ID_SET = new Set(Object.values(APPLE_SUBSCRIPTION_PRODUCTS).map((p) => p.productId));

let connectionReady = false;
const isIos = () => Platform.OS === "ios";

const ensureIapConnection = async () => {
  if (!isIos()) return false;
  if (connectionReady) return true;
  const ready = await Promise.race([
    IAP.initConnection(),
    new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error("IAP.initConnection timeout")), 10000)
    ),
  ]);
  connectionReady = ready;
  return ready;
};

const finishTransactionSafe = async (purchase: Purchase) => {
  try {
    await IAP.finishTransaction({ purchase, isConsumable: false });
  } catch (error) {
    console.warn("finishTransaction failed", error);
  }
};

const isUuidV4 = (value: string) => {
  if (!value || value.length !== 36) return false;
  const positions = [8, 13, 18, 23];
  for (const pos of positions) {
    if (value[pos] !== "-") return false;
  }
  if (value[14] !== "4") return false;
  const variant = value[19];
  if (!variant) return false;
  const variantLower = variant.toLowerCase();
  if (variantLower !== "8" && variantLower !== "9" && variantLower !== "a" && variantLower !== "b") {
    return false;
  }
  const hex = "0123456789abcdef";
  for (let i = 0; i < value.length; i++) {
    if (positions.includes(i)) continue;
    const ch = value[i].toLowerCase();
    if (!hex.includes(ch)) return false;
  }
  return true;
};

const assertUuidV4 = (value: string, label: string) => {
  if (!isUuidV4(value)) {
    throw new Error(`${label} must be a UUID v4 (use crypto.randomUUID()).`);
  }
};

const handlePurchase = async (
  purchase: Purchase,
  onPurchased?: (payload: { purchase: Purchase }) => Promise<boolean | void> | boolean | void,
  onError?: (error: PurchaseError) => void
) => {
  try {
    if (onPurchased) {
      const result = await onPurchased({ purchase });
      if (result === false) {
        return;
      }
      await finishTransactionSafe(purchase);
      return;
    }

    await finishTransactionSafe(purchase);
  } catch (error) {
    console.error("Apple purchase handling failed", error);
    onError?.(error as PurchaseError);
  }
};

export async function fetchAppleSubscriptions(): Promise<ProductSubscription[]> {
  if (!isIos()) return [];
  await ensureIapConnection();
  await new Promise<void>((resolve) => InteractionManager.runAfterInteractions(resolve));

  const skus = Object.values(APPLE_SUBSCRIPTION_PRODUCTS).map((product) => product.productId);
  let products: ProductSubscription[] = [];
  try {
    products = await (IAP as any).getSubscriptions(skus);
  } catch (error) {
    products = await IAP.getSubscriptions({ skus });
  }

  if (!products || products.length === 0) {
    console.warn("No Apple subscriptions returned for SKUs:", skus);
    throw new Error("Unable to load Apple subscriptions.");
  }

  return products as ProductSubscription[];
}

export async function purchaseSubscription(
  tier: AppleSubscriptionTier,
  appAccountToken: string
): Promise<void> {
  if (!isIos()) return;
  await ensureIapConnection();
  assertUuidV4(appAccountToken, "appAccountToken");

  const productId = APPLE_SUBSCRIPTION_PRODUCTS[tier].productId;
  const requestSubscription = (IAP as any).requestSubscription as
    | ((options: Record<string, unknown>) => Promise<void>)
    | undefined;

  if (requestSubscription) {
    await requestSubscription({
      sku: productId,
      appAccountToken,
      andDangerouslyFinishTransactionAutomatically: false,
    });
    return;
  }

  await IAP.requestPurchase({
    type: "subs",
    request: {
      apple: {
        sku: productId,
        appAccountToken,
        andDangerouslyFinishTransactionAutomatically: false,
      },
    },
  });
}

export async function restorePurchases(
  appAccountToken: string,
  options?: {
    onRestored?: (payload: { purchase: Purchase }) => Promise<boolean | void> | boolean | void;
    onError?: (error: PurchaseError) => void;
  }
): Promise<void> {
  if (!isIos()) return;
  await ensureIapConnection();
  assertUuidV4(appAccountToken, "appAccountToken");

  const restorePurchases = (IAP as any).restorePurchases as (() => Promise<void>) | undefined;
  if (restorePurchases) {
    await restorePurchases();
  }

  const getAvailablePurchases = (IAP as any).getAvailablePurchases as
    | ((options?: Record<string, unknown>) => Promise<Purchase[]>)
    | undefined;

  const purchases = getAvailablePurchases ? await getAvailablePurchases() : [];
  const relevantPurchases = (purchases || []).filter((purchase) =>
    purchase.productId ? PRODUCT_ID_SET.has(purchase.productId) : false
  );

  for (const purchase of relevantPurchases) {
    await handlePurchase(purchase, options?.onRestored, options?.onError);
  }
}

export function openAppleSubscriptionManager() {
  if (!isIos()) return;

  const deepLink = (IAP as any).deepLinkToSubscriptionsIOS as (() => Promise<void>) | undefined;
  if (deepLink) {
    return deepLink();
  }

  return Linking.openURL("https://apps.apple.com/account/subscriptions");
}

export function addPurchaseListeners({
  onPurchased,
  onError,
  appAccountToken,
}: {
  onPurchased?: (payload: { purchase: Purchase }) => Promise<boolean | void> | boolean | void;
  onError?: (error: PurchaseError) => void;
  appAccountToken?: string;
}) {
  if (!isIos()) {
    return { remove: () => {} };
  }

  if (appAccountToken) {
    assertUuidV4(appAccountToken, "appAccountToken");
  }
  const purchaseUpdatedSub = IAP.purchaseUpdatedListener(async (purchase) => {
    await handlePurchase(purchase, onPurchased, onError);
  });

  const purchaseErrorSub = IAP.purchaseErrorListener((error) => {
    onError?.(error);
  });

  return {
    remove: () => {
      purchaseUpdatedSub.remove();
      purchaseErrorSub.remove();
    },
  };
}
