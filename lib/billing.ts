import { Platform, Linking, EmitterSubscription } from "react-native";
import Constants from "expo-constants";
import type { ProductPurchase, Subscription } from "react-native-iap";
import { supabase } from "./supabase";
import { buildPaddleCheckoutUrl, PADDLE_PRICE_IDS, canMakePayments } from "./paddle";

type SubscriptionTier = "basic" | "standard" | "premium" | "pro";
type BillingPlatform = "apple" | "paddle";

export interface BillingPlan {
  id: string;
  tier: SubscriptionTier;
  title: string;
  description?: string | null;
  localizedPrice?: string | null;
  platform: BillingPlatform;
  productId?: string | null;
  priceId?: string | null;
  features?: string[];
}

export interface PurchaseResult {
  success: boolean;
  platform: BillingPlatform;
  tier?: SubscriptionTier;
  error?: string;
  message?: string;
}

interface AppleVerificationResponse {
  entitled?: boolean;
  tier?: SubscriptionTier;
  subscription_platform?: BillingPlatform;
}

const APPLE_PRODUCTS: Array<{ id: string; tier: SubscriptionTier }> = [
  { id: "unipilot_basic_monthly", tier: "basic" },
  { id: "unipilot_standard_monthly", tier: "standard" },
  { id: "unipilot_premium_monthly", tier: "premium" },
];

const PLAN_FEATURES: Record<SubscriptionTier, string[]> = {
  basic: [
    "Access to basic journey modules",
    "Document management",
    "Basic checklist items",
    "Email support",
  ],
  standard: [
    "Everything in Basic",
    "All journey roadmap modules",
    "Advanced checklist items",
    "Priority email support",
    "Resource library access",
  ],
  premium: [
    "Everything in Standard",
    "Unlimited AI assistance",
    "1-on-1 consultation sessions",
    "Premium document templates",
    "Priority support",
    "Early access to new features",
  ],
  pro: [
    "Everything in Standard",
    "Unlimited AI assistance",
    "1-on-1 consultation sessions",
    "Premium document templates",
    "Priority support",
    "Early access to new features",
  ],
};

const isExpoGo = Constants.executionEnvironment === "storeClient";

let IAP: typeof import("react-native-iap") | null = null;
try {
  if (Platform.OS === "ios") {
    IAP = require("react-native-iap");
  }
} catch (error) {
  console.warn("react-native-iap not available in this environment:", error);
}

let purchaseUpdateSub: EmitterSubscription | null = null;
let purchaseErrorSub: EmitterSubscription | null = null;
let initializationPromise: Promise<void> | null = null;

const pendingPurchases = new Map<string, (result: PurchaseResult) => void>();

export async function initializeBilling(): Promise<void> {
  if (Platform.OS !== "ios" || isExpoGo || !IAP) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    await IAP!.initConnection();
    ensurePurchaseListeners();
  })().catch((error) => {
    initializationPromise = null;
    throw error;
  });

  return initializationPromise;
}

function ensurePurchaseListeners() {
  if (!IAP || purchaseUpdateSub) return;

  purchaseUpdateSub = IAP.purchaseUpdatedListener(async (purchase: ProductPurchase) => {
    if (Platform.OS !== "ios") return;
    await handleApplePurchase(purchase);
  });

  purchaseErrorSub = IAP.purchaseErrorListener((error) => {
    const errorMessage = error?.message || "Purchase failed";
    console.error("Apple purchase error:", error);
    pendingPurchases.forEach((resolve) =>
      resolve({
        success: false,
        platform: "apple",
        error: errorMessage,
      })
    );
    pendingPurchases.clear();
  });
}

async function handleApplePurchase(purchase: ProductPurchase) {
  if (!IAP) return;

  const productId = purchase.productId;
  const receipt = purchase.transactionReceipt;

  let result: PurchaseResult = {
    success: false,
    platform: "apple",
    error: "Missing purchase receipt",
  };

  if (productId && receipt) {
    try {
      const verification = await verifyAppleReceipt(productId, receipt);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (verification?.entitled) {
        let platformIsApple = verification.subscription_platform === "apple";
        let tier: SubscriptionTier | undefined = verification.tier;

        if (userId && !platformIsApple) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_tier, subscription_platform")
            .eq("id", userId)
            .single();

          platformIsApple = profile?.subscription_platform === "apple";
          tier = (profile?.subscription_tier as SubscriptionTier) || tier;
        }

        if (platformIsApple) {
          await IAP.finishTransaction({ purchase, isConsumable: false });
          result = {
            success: true,
            platform: "apple",
            tier,
          };
        } else {
          result = {
            success: false,
            platform: "apple",
            error: "Subscription not confirmed by Supabase yet",
          };
        }
      } else {
        result = {
          success: false,
          platform: "apple",
          error: "Purchase could not be verified",
        };
      }
    } catch (error: any) {
      result = {
        success: false,
        platform: "apple",
        error: error?.message || "Failed to process purchase",
      };
    }
  }

  const pendingResolver = pendingPurchases.get(productId || "");
  if (pendingResolver) {
    pendingResolver(result);
    pendingPurchases.delete(productId || "");
  }
}

async function verifyAppleReceipt(productId: string, receipt: string) {
  const { data, error } = await supabase.functions.invoke<AppleVerificationResponse>("verify-apple-iap", {
    body: {
      productId,
      receipt,
      platform: "ios",
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

function titleCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

async function fetchPaddlePlans(): Promise<BillingPlan[]> {
  const fallbackPlans: BillingPlan[] = Object.entries(PADDLE_PRICE_IDS).map(([tier, priceId]) => ({
    id: priceId,
    tier: tier as SubscriptionTier,
    title: titleCase(tier),
    description: null,
    localizedPrice: null,
    platform: "paddle",
    priceId,
    features: PLAN_FEATURES[tier as SubscriptionTier],
  }));

  try {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("tier, title, description, localized_price, price_id, platform")
      .eq("platform", "paddle");

    if (error || !data?.length) {
      return fallbackPlans;
    }

    return data.map((plan: any) => {
      const tier = (plan?.tier || "basic") as SubscriptionTier;
      return {
        id: plan?.price_id || plan?.tier,
        tier,
        title: plan?.title || titleCase(tier),
        description: plan?.description,
        localizedPrice: plan?.localized_price || null,
        platform: "paddle" as BillingPlatform,
        priceId: plan?.price_id || null,
        features: PLAN_FEATURES[tier],
      };
    });
  } catch (error) {
    console.error("Failed to fetch Paddle plans from Supabase:", error);
    return fallbackPlans;
  }
}

export async function getAvailablePlans(): Promise<BillingPlan[]> {
  if (Platform.OS === "ios") {
    let subscriptions: Subscription[] = [];

    if (!isExpoGo && IAP) {
      await initializeBilling();
      const appleIds = APPLE_PRODUCTS.map((product) => product.id);

      try {
        subscriptions = await IAP.getSubscriptions(appleIds);
      } catch (error) {
        console.error("Failed to fetch Apple subscriptions:", error);
      }
    }

    const applePlans = APPLE_PRODUCTS.map((product) => {
      const subscription = subscriptions.find((item) => item.productId === product.id);

      return {
        id: product.id,
        tier: product.tier,
        title: subscription?.title || subscription?.name || titleCase(product.tier),
        description: subscription?.description || null,
        localizedPrice: subscription?.localizedPrice || subscription?.priceString || null,
        platform: "apple" as BillingPlatform,
        productId: product.id,
        features: PLAN_FEATURES[product.tier],
      } as BillingPlan;
    });

    return applePlans;
  }

  return fetchPaddlePlans();
}

export async function purchasePlan(planId: string): Promise<PurchaseResult> {
  if (Platform.OS === "ios") {
    if (isExpoGo || !IAP) {
      return {
        success: false,
        platform: "apple",
        error: "Apple In-App Purchases require a dev build or TestFlight build.",
      };
    }

    await initializeBilling();
    return purchaseAppleSubscription(planId);
  }

  return purchasePaddlePlan(planId);
}

export function isAppleIapAvailable() {
  return Platform.OS === "ios" && !isExpoGo && !!IAP;
}

async function purchaseAppleSubscription(productId: string): Promise<PurchaseResult> {
  if (!IAP) {
    return {
      success: false,
      platform: "apple",
      error: "Apple IAP not available",
    };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return {
      success: false,
      platform: "apple",
      error: "You must be logged in to purchase a subscription.",
    };
  }

  try {
    const purchasePromise = new Promise<PurchaseResult>((resolve) => {
      pendingPurchases.set(productId, resolve);
    });

    await IAP.requestSubscription({ sku: productId });
    return purchasePromise;
  } catch (error: any) {
    pendingPurchases.delete(productId);
    return {
      success: false,
      platform: "apple",
      error: error?.message || "Unable to start Apple purchase",
    };
  }
}

function resolvePaddlePlan(planId: string) {
  const entry = Object.entries(PADDLE_PRICE_IDS).find(
    ([tier, priceId]) => planId === priceId || planId === tier
  );

  if (!entry) return null;

  const [tier, priceId] = entry as [SubscriptionTier, string];
  return { tier, priceId };
}

async function purchasePaddlePlan(planId: string): Promise<PurchaseResult> {
  const resolvedPlan = resolvePaddlePlan(planId);

  if (!resolvedPlan) {
    return {
      success: false,
      platform: "paddle",
      error: "Unknown Paddle plan",
    };
  }

  if (!canMakePayments()) {
    return {
      success: false,
      platform: "paddle",
      error: "Payments are not available on this device.",
    };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return {
      success: false,
      platform: "paddle",
      error: "You must be logged in to purchase a subscription.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, country_origin, destination_country")
    .eq("id", auth.user.id)
    .single();

  const checkoutUrl = buildPaddleCheckoutUrl({
    priceId: resolvedPlan.priceId,
    userEmail: profile?.email || auth.user.email || undefined,
    userId: auth.user.id,
    tier: resolvedPlan.tier === "premium" ? "pro" : (resolvedPlan.tier as "basic" | "standard" | "pro"),
    countryCode: profile?.destination_country || undefined,
  });

  const canOpen = await Linking.canOpenURL(checkoutUrl);
  if (!canOpen) {
    return {
      success: false,
      platform: "paddle",
      error: "Unable to open Paddle checkout.",
    };
  }

  await Linking.openURL(checkoutUrl);

  return {
    success: true,
    platform: "paddle",
    tier: resolvedPlan.tier,
    message: "Redirected to Paddle checkout",
  };
}
