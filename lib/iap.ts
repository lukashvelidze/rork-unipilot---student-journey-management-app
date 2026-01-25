import { InteractionManager, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import * as IAP from "react-native-iap";
import type {
  Purchase,
  PurchaseError,
  ProductSubscription,
} from "react-native-iap";


export type AppleSubscriptionTier = "basic" | "standard" | "pro";
export type SubscriptionEntitlement = "none" | AppleSubscriptionTier;

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

const toDateMs = (value: unknown) => {
  if (value == null) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  }
  return 0;
};

export const APPLE_PRODUCT_IDS = [
  appStoreProducts.basic ||
    process.env.EXPO_PUBLIC_APP_STORE_PRODUCT_ID_BASIC ||
    DEFAULT_APPLE_PRODUCTS.basic,
  appStoreProducts.standard ||
    process.env.EXPO_PUBLIC_APP_STORE_PRODUCT_ID_STANDARD ||
    DEFAULT_APPLE_PRODUCTS.standard,
  appStoreProducts.pro ||
    process.env.EXPO_PUBLIC_APP_STORE_PRODUCT_ID_PRO ||
    DEFAULT_APPLE_PRODUCTS.pro,
] as const;

type AppleProductConfig = {
  productId: (typeof APPLE_PRODUCT_IDS)[number];
  referenceName: string;
};

export const APPLE_SUBSCRIPTION_PRODUCTS: Record<AppleSubscriptionTier, AppleProductConfig> = {
  basic: {
    productId: APPLE_PRODUCT_IDS[0],
    referenceName: "UniPilot Basic",
  },
  standard: {
    productId: APPLE_PRODUCT_IDS[1],
    referenceName: "UniPilot Standard",
  },
  pro: {
    productId: APPLE_PRODUCT_IDS[2],
    referenceName: "UniPilot Premium",
  },
};

const PRODUCT_ID_TO_TIER: Record<string, AppleSubscriptionTier> = Object.entries(
  APPLE_SUBSCRIPTION_PRODUCTS
).reduce((acc, [tier, config]) => {
  acc[config.productId] = tier as AppleSubscriptionTier;
  return acc;
}, {} as Record<string, AppleSubscriptionTier>);

let connectionReady = false;

export const getIapLoadError = () => null;

export const isIosIapAvailable = () => Platform.OS === "ios";

export async function ensureIapConnection(): Promise<boolean> {
  if (!isIosIapAvailable()) {
    return false;
  }

  if (connectionReady) {
    return true;
  }

  const ready = await IAP.initConnection();
  connectionReady = ready;
  return ready;
}

export async function closeIapConnection() {
  if (!connectionReady) {
    return;
  }

  try {
    await IAP.endConnection();
  } finally {
    connectionReady = false;
  }
}

export async function fetchAppleSubscriptions(): Promise<ProductSubscription[]> {
  if (!isIosIapAvailable()) {
    return [];
  }

  await ensureIapConnection();
  await new Promise<void>((resolve) => InteractionManager.runAfterInteractions(resolve));
  const products = await IAP.getSubscriptions({
    skus: Object.values(APPLE_SUBSCRIPTION_PRODUCTS).map((product) => product.productId),
  });

  return products as ProductSubscription[];
}

export function mapProductIdToTier(productId: string): AppleSubscriptionTier | null {
  return PRODUCT_ID_TO_TIER[productId] || null;
}

const getPurchaseTimestamp = (purchase: Purchase) => {
  const raw =
    (purchase as any).transactionDate ||
    (purchase as any).originalTransactionDateIOS ||
    (purchase as any).purchaseDate;
  return toDateMs(raw);
};

const getPurchaseExpiration = (purchase: Purchase) => {
  const raw =
    (purchase as any).expirationDate ||
    (purchase as any).expiresDate ||
    (purchase as any).expiresDateMs;
  return toDateMs(raw);
};

export async function getActiveAppleSubscription(): Promise<SubscriptionEntitlement> {
  if (!isIosIapAvailable()) {
    return "none";
  }

  await ensureIapConnection();

  const getAvailablePurchases = (IAP as any).getAvailablePurchases as
    | ((options?: Record<string, unknown>) => Promise<Purchase[]>)
    | undefined;

  if (!getAvailablePurchases) {
    console.warn("IAP.getAvailablePurchases is not available.");
    return "none";
  }

  const purchases = await getAvailablePurchases();
  const activeSubs = (purchases || []).filter((purchase) => {
    if (!purchase.productId || !PRODUCT_ID_TO_TIER[purchase.productId]) {
      return false;
    }

    const expiresAt = getPurchaseExpiration(purchase);
    if (expiresAt > 0) {
      return expiresAt > Date.now();
    }

    return true;
  });

  if (!activeSubs.length) {
    return "none";
  }

  const latest = activeSubs.sort(
    (a, b) => getPurchaseTimestamp(b) - getPurchaseTimestamp(a)
  )[0];

  return PRODUCT_ID_TO_TIER[latest.productId] || "none";
}

export async function restoreApplePurchases(): Promise<SubscriptionEntitlement> {
  if (!isIosIapAvailable()) {
    return "none";
  }

  const restorePurchases = (IAP as any).restorePurchases as (() => Promise<void>) | undefined;
  if (restorePurchases) {
    await restorePurchases();
  }

  return getActiveAppleSubscription();
}

export function openAppleSubscriptionManager() {
  if (!isIosIapAvailable()) {
    return;
  }

  const deepLink = (IAP as any).deepLinkToSubscriptionsIOS as (() => Promise<void>) | undefined;
  if (deepLink) {
    return deepLink();
  }

  return Linking.openURL("https://apps.apple.com/account/subscriptions");
}

export async function changeApplePlan(
  targetTier: AppleSubscriptionTier,
  appAccountToken?: string
) {
  const productId = APPLE_SUBSCRIPTION_PRODUCTS[targetTier].productId;
  return requestAppleSubscription(productId, appAccountToken);
}

export function formatAppleSubscriptionPeriod(product?: ProductSubscription) {
  if (!product || product.type !== "subs") {
    return "/month";
  }

  const unit =
    (product as any).subscriptionInfoIOS?.subscriptionPeriod?.unit ||
    (product as any).subscriptionPeriodUnitIOS;
  const countRaw =
    (product as any).subscriptionInfoIOS?.subscriptionPeriod?.value ||
    (product as any).subscriptionPeriodNumberIOS;

  if (!unit) {
    return "/month";
  }

  const count = countRaw ? Number(countRaw) : 1;
  const suffix = count > 1 ? `${unit.toLowerCase()}s` : unit.toLowerCase();
  return `/${count} ${suffix}`;
}

// Event helpers to keep react-native-iap dynamic
export const addPurchaseUpdatedListener = (
  listener: (purchase: Purchase) => void
) => {
  return IAP.purchaseUpdatedListener(listener);
};

export const addPurchaseErrorListener = (
  listener: (error: PurchaseError) => void
) => {
  return IAP.purchaseErrorListener(listener);
};

export const finishTransactionSafe = async (purchase: Purchase) => {
  try {
    await IAP.finishTransaction({ purchase, isConsumable: false });
  } catch (error) {
    console.warn("finishTransaction failed", error);
  }
};

export const requestAppleSubscription = async (productId: string, appAccountToken?: string) => {
  return IAP.requestPurchase({
    type: "subs",
    request: {
      apple: {
        sku: productId,
        andDangerouslyFinishTransactionAutomatically: false,
        appAccountToken,
      },
    },
  });
};

export type { Purchase, PurchaseError, ProductSubscription };
