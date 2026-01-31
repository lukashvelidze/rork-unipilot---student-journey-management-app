import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

export type SubscriptionTier = "free" | "basic" | "standard" | "premium";
export type SubscriptionEntitlement = "none" | Exclude<SubscriptionTier, "free">;
export const ENTITLEMENT_IDS = {
  basic: "basic",
  standard: "standard",
  premium: "premium",
} as const;
export const DEFAULT_OFFERING_ID = "unipilot_default";

const IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "appl_LSCLUounvoWbAulvkjXMvSrXuVy";
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";

type RevenueCatState = {
  configuringPromise: Promise<void> | null;
  configuredUserId: string | null;
  configured: boolean;
};

const getRevenueCatState = (): RevenueCatState => {
  const globalState = globalThis as typeof globalThis & {
    __unipilotRevenueCatState?: RevenueCatState;
  };
  if (!globalState.__unipilotRevenueCatState) {
    globalState.__unipilotRevenueCatState = {
      configuringPromise: null,
      configuredUserId: null,
      configured: false,
    };
  }
  return globalState.__unipilotRevenueCatState;
};

const getApiKeyForPlatform = () => {
  if (Platform.OS === "ios") {
    return IOS_API_KEY;
  }
  if (Platform.OS === "android") {
    return ANDROID_API_KEY;
  }
  return null;
};

const ensureConfigured = async (appUserId?: string) => {
  const apiKey = getApiKeyForPlatform();
  if (!apiKey) {
    throw new Error(`Missing RevenueCat API key for ${Platform.OS}.`);
  }

  const state = getRevenueCatState();

  if (!state.configured && !state.configuringPromise) {
    state.configuringPromise = (async () => {
      Purchases.setLogLevel(LOG_LEVEL.INFO);
      Purchases.configure({ apiKey, appUserID: appUserId });
      state.configuredUserId = appUserId ?? null;
      state.configured = true;
    })();
  }

  await state.configuringPromise;

  if (appUserId && appUserId !== state.configuredUserId) {
    await Purchases.logIn(appUserId);
    state.configuredUserId = appUserId;
  }
};

export async function configureRevenueCat(appUserId?: string) {
  await ensureConfigured(appUserId);
}

export function addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void) {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

export async function getOfferings(): Promise<PurchasesOfferings> {
  await ensureConfigured();
  return Purchases.getOfferings();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  await ensureConfigured();
  return Purchases.getCustomerInfo();
}

export function getActiveSubscriptionTier(info?: CustomerInfo | null): SubscriptionTier {
  if (!info) {
    return "free";
  }

  if (info.entitlements.active?.[ENTITLEMENT_IDS.premium]) {
    return "premium";
  }
  if (info.entitlements.active?.[ENTITLEMENT_IDS.standard]) {
    return "standard";
  }
  if (info.entitlements.active?.[ENTITLEMENT_IDS.basic]) {
    return "basic";
  }
  return "free";
}

export function hasTierAccess(
  info: CustomerInfo | null | undefined,
  requiredTier: Exclude<SubscriptionTier, "free">
): boolean {
  const rank: Record<SubscriptionTier, number> = {
    free: 0,
    basic: 1,
    standard: 2,
    premium: 3,
  };
  return rank[getActiveSubscriptionTier(info)] >= rank[requiredTier];
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  await ensureConfigured();
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error) {
    const purchasesError = error as PurchasesError;
    if (purchasesError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return null;
    }
    throw purchasesError;
  }
}

export async function presentPaywall(params?: {
  offering?: PurchasesOffering;
  displayCloseButton?: boolean;
  fontFamily?: string | null;
}): Promise<PAYWALL_RESULT> {
  await ensureConfigured();
  return RevenueCatUI.presentPaywall(params);
}

export async function presentPaywallIfNeeded(params?: {
  offering?: PurchasesOffering;
  displayCloseButton?: boolean;
  fontFamily?: string | null;
  requiredEntitlementIdentifier?: string;
}): Promise<PAYWALL_RESULT> {
  await ensureConfigured();
  return RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier:
      params?.requiredEntitlementIdentifier || ENTITLEMENT_IDS.premium,
    offering: params?.offering,
    displayCloseButton: params?.displayCloseButton,
    fontFamily: params?.fontFamily,
  });
}

export async function restorePurchases(): Promise<CustomerInfo> {
  await ensureConfigured();
  return Purchases.restorePurchases();
}

export async function openCustomerCenter() {
  await ensureConfigured();
  return RevenueCatUI.presentCustomerCenter();
}

export async function logOutRevenueCatIfNeeded() {
  const state = getRevenueCatState();
  if (!state.configuredUserId) {
    return;
  }
  await ensureConfigured();
  await Purchases.logOut();
  state.configuredUserId = null;
}

export async function restoreApplePurchases(): Promise<SubscriptionEntitlement> {
  const info = await restorePurchases();
  const tier = getActiveSubscriptionTier(info);
  return tier === "free" ? "none" : tier;
}

export async function openAppleSubscriptionManager() {
  return openCustomerCenter();
}

export { PAYWALL_RESULT, PURCHASES_ERROR_CODE };
export type {
  CustomerInfo,
  PurchasesError,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
};
