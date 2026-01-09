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
  sharedSecret?: string;
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

const APP_STORE_SHARED_SECRET =
  appStoreConfig.sharedSecret || process.env.EXPO_PUBLIC_APP_STORE_SHARED_SECRET;

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

const shouldUseSandbox = (): boolean => {
  const env = process.env.EXPO_PUBLIC_APP_ENV;
  if (env) {
    return env !== "production";
  }
  return __DEV__;
};

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
  const products = await IAP.fetchProducts({
    skus: Object.values(APPLE_SUBSCRIPTION_PRODUCTS).map((product) => product.productId),
    type: "subs",
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
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
};

const getPurchaseExpiration = (purchase: Purchase) => {
  const raw =
    (purchase as any).expirationDate ||
    (purchase as any).expiresDate ||
    (purchase as any).expiresDateMs;
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
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

type ReceiptValidationResult = {
  valid: boolean;
  productId?: string;
  expiresAt?: string;
  environment?: string;
  status?: number;
  reason?: "missing_receipt" | "missing_shared_secret";
};

type AppleReceiptInfo = {
  product_id?: string;
  productId?: string;
  expires_date_ms?: string;
  purchase_date_ms?: string;
};

const APPLE_RECEIPT_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_RECEIPT_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";

const selectLatestReceiptInfo = (payload: any): AppleReceiptInfo | null => {
  const latestInfo = Array.isArray(payload?.latest_receipt_info)
    ? payload.latest_receipt_info
    : Array.isArray(payload?.receipt?.in_app)
      ? payload.receipt.in_app
      : [];

  if (!latestInfo.length) {
    return null;
  }

  return latestInfo.reduce((current: AppleReceiptInfo, entry: AppleReceiptInfo) => {
    const currentMs = Number(current?.expires_date_ms || current?.purchase_date_ms || 0);
    const entryMs = Number(entry?.expires_date_ms || entry?.purchase_date_ms || 0);
    return entryMs >= currentMs ? entry : current;
  }, latestInfo[0]);
};

const postReceiptValidation = async (
  endpoint: string,
  receiptData: string
) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receiptData,
      password: APP_STORE_SHARED_SECRET,
      "exclude-old-transactions": true,
    }),
  });

  return response.json();
};

export async function validateAppleReceipt(
  receiptData: string | undefined,
  productId?: string
): Promise<ReceiptValidationResult> {
  const receipt = receiptData?.trim();
  if (!receipt) {
    return { valid: false, productId, reason: "missing_receipt" };
  }

  if (!APP_STORE_SHARED_SECRET) {
    return { valid: false, productId, reason: "missing_shared_secret" };
  }

  let environment = shouldUseSandbox() ? "Sandbox" : "Production";
  const initialUrl =
    environment === "Sandbox" ? APPLE_RECEIPT_SANDBOX_URL : APPLE_RECEIPT_PRODUCTION_URL;

  try {
    let payload = await postReceiptValidation(initialUrl, receipt);

    if (payload?.status === 21007 && environment === "Production") {
      payload = await postReceiptValidation(APPLE_RECEIPT_SANDBOX_URL, receipt);
      environment = "Sandbox";
    } else if (payload?.status === 21008 && environment === "Sandbox") {
      payload = await postReceiptValidation(APPLE_RECEIPT_PRODUCTION_URL, receipt);
      environment = "Production";
    }

    if (!payload || typeof payload.status !== "number") {
      return { valid: false, productId, environment };
    }

    if (payload.status !== 0) {
      return { valid: false, productId, environment, status: payload.status };
    }

    const latestInfo = selectLatestReceiptInfo(payload);
    const expiresMs = latestInfo?.expires_date_ms
      ? Number(latestInfo.expires_date_ms)
      : undefined;
    const expiresAt = typeof expiresMs === "number" ? new Date(expiresMs).toISOString() : undefined;
    const isExpired = typeof expiresMs === "number" ? expiresMs <= Date.now() : false;
    const resolvedProductId = productId || latestInfo?.product_id || latestInfo?.productId;

    return {
      valid: !isExpired,
      productId: resolvedProductId,
      expiresAt,
      environment,
      status: payload.status,
    };
  } catch (error) {
    console.warn("Apple receipt validation failed", error);
    return {
      valid: false,
      productId,
      environment,
    };
  }
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
