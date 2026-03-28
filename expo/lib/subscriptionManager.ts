import { Linking, Platform } from "react-native";
import { openAppleSubscriptionManager } from "@/lib/iap";
import { getPaddleCustomerId } from "@/lib/paddle-customer";
import { buildPaddleCustomerPortalUrl } from "@/lib/paddle";

export async function openManageSubscription(): Promise<void> {
  if (Platform.OS === "ios") {
    await openAppleSubscriptionManager();
    return;
  }

  const customerId = await getPaddleCustomerId();
  if (!customerId) {
    throw new Error("NO_SUBSCRIPTION");
  }

  const portalUrl = buildPaddleCustomerPortalUrl(customerId);
  if (!portalUrl) {
    throw new Error("NO_PORTAL");
  }

  const supported = await Linking.canOpenURL(portalUrl);
  if (!supported) {
    throw new Error("UNSUPPORTED_URL");
  }

  await Linking.openURL(portalUrl);
}
