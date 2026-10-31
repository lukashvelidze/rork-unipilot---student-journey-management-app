import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { ArrowRight, Check, Minus, Sparkles, X } from "lucide-react-native";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { FREE_UNIVERSITY_LIMIT } from "@/lib/journeyRoutes";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_OFFERING_ID,
  PURCHASES_ERROR_CODE,
  addCustomerInfoUpdateListener,
  configureRevenueCat,
  getActiveSubscriptionTier,
  getCustomerInfo,
  getOfferings,
  openAppleSubscriptionManager,
  purchasePackage,
  restorePurchases,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "@/lib/iap";
import { useUserStore } from "@/store/userStore";

const PRIVACY_POLICY_URL = "https://unipilot.app/privacy";
const TERMS_OF_USE_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

/** Free vs Pro, row by row. `true` = included, string = included with a limit. */
const COMPARISON: { label: string; free: boolean | string; pro: boolean | string }[] = [
  { label: "Universities you can follow", free: `${FREE_UNIVERSITY_LIMIT}`, pro: "Unlimited" },
  { label: "Research & application roadmap", free: true, pro: true },
  { label: "Tasks & deadline reminders", free: true, pro: true },
  { label: "Every study-abroad guide", free: true, pro: true },
  { label: "Document Vault", free: "Core docs", pro: "All types" },
  { label: "Visa, travel & pre-departure stages", free: false, pro: true },
  { label: "Arrival, academic & career stages", free: false, pro: true },
  { label: "AI interview practice", free: "3 sessions", pro: "Unlimited" },
];

/** Paid profile tiers from the old plans all mean Pro. */
const isPro = (tier?: string | null) => !!tier && tier.toLowerCase() !== "free";

type PlanOption = { key: string; label: string; pkg: PurchasesPackage; note?: string };

/** UniPilot Pro: one plan, honest Free vs Pro comparison, purchase, restore and manage. */
export default function PremiumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = useAppBack("/(tabs)");
  const updateUser = useUserStore((state) => state.updateUser);
  const isWeb = Platform.OS === "web";
  const syncedPro = useRef(false);

  const [pro, setPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [storeUnavailable, setStoreUnavailable] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const currentOffering = (offerings?.all && offerings.all[DEFAULT_OFFERING_ID]) || offerings?.current || null;

  // Pro packages: yearly and monthly when configured. Until the "pro" products
  // exist, the old Premium package (whose entitlement now grants Pro) stands in.
  const options = useMemo<PlanOption[]>(() => {
    const packages = currentOffering?.availablePackages ?? [];
    // e.g. unipilot_pro_monthly / unipilot_pro_annual; never the old basic/standard plans.
    const isPro = (pkg: PurchasesPackage) => /(^|[_.\-])pro([_.\-]|$)/i.test(pkg.product.identifier);
    const isPremium = (pkg: PurchasesPackage) => /premium/i.test(pkg.product.identifier);
    const proPackages = packages.filter(isPro);
    const candidates = proPackages.length ? proPackages : packages.filter(isPremium);
    const annual = candidates.find((pkg) => pkg.packageType === "ANNUAL" || /annual|year/i.test(pkg.identifier));
    const monthly = candidates.find((pkg) => pkg !== annual);
    const list: PlanOption[] = [];
    if (annual) {
      const monthlyPrice = monthly?.product.price;
      const saving =
        monthlyPrice && annual.product.price ? Math.round((1 - annual.product.price / (monthlyPrice * 12)) * 100) : 0;
      list.push({ key: "annual", label: "Yearly", pkg: annual, note: saving > 0 ? `Save ${saving}%` : undefined });
    }
    if (monthly) list.push({ key: "monthly", label: "Monthly", pkg: monthly });
    return list;
  }, [currentOffering]);

  useEffect(() => {
    if (!selectedKey && options.length) setSelectedKey(options[0].key);
  }, [options, selectedKey]);

  const selected = options.find((option) => option.key === selectedKey) ?? options[0] ?? null;
  const periodLabel = (option: PlanOption) => (option.key === "annual" ? "year" : "month");

  const syncProfileTier = useCallback(
    async (info: CustomerInfo | null) => {
      // Only ever raise the tier from the device: Pro can also come from the web,
      // promos or support, and expiries are handled server-side by store webhooks.
      if (getActiveSubscriptionTier(info) !== "pro" || syncedPro.current) return;
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;
      syncedPro.current = true;
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", authUser.id)
        .single();
      if (isPro(profile?.subscription_tier)) return;
      // Stored as "premium": the column's check constraint predates the Pro plan,
      // and every paid value means Pro in the app.
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_tier: "premium", updated_at: new Date().toISOString() })
        .eq("id", authUser.id);
      if (error) console.warn("Failed to sync subscription tier:", error);
      updateUser({ subscriptionTier: "pro", isPremium: true });
    },
    [updateUser],
  );

  const refreshProfileTier = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return setPro(false);
    const { data } = await supabase.from("profiles").select("subscription_tier").eq("id", authUser.id).single();
    setPro(isPro(data?.subscription_tier));
  }, []);

  const refreshStore = useCallback(async () => {
    if (isWeb) return;
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      await configureRevenueCat(authUser?.id);
      const [freshOfferings, info] = await Promise.all([getOfferings(), getCustomerInfo()]);
      setOfferings(freshOfferings);
      const offering = freshOfferings.all?.[DEFAULT_OFFERING_ID] || freshOfferings.current;
      setStoreUnavailable(!offering || offering.availablePackages.length === 0);
      await syncProfileTier(info);
    } catch (error) {
      console.error("RevenueCat init failed:", error);
      setStoreUnavailable(true);
    }
  }, [isWeb, syncProfileTier]);

  const refresh = useCallback(async () => {
    try {
      await refreshProfileTier();
      setIsLoading(false);
      await refreshStore();
      await refreshProfileTier();
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfileTier, refreshStore]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (isWeb) return;
    const remove = addCustomerInfoUpdateListener(async (info) => {
      await syncProfileTier(info);
      await refreshProfileTier();
    });
    return () => {
      remove();
    };
  }, [isWeb, refreshProfileTier, syncProfileTier]);

  const subscribe = async () => {
    if (isWeb) {
      Alert.alert("Not supported", "Subscriptions are available in the iOS and Android apps.");
      return;
    }
    if (!selected) {
      Alert.alert("Pro unavailable", "We couldn't reach the App Store. Please try again in a moment.");
      return;
    }
    setIsProcessing(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      await configureRevenueCat(authUser?.id);
      const info = await purchasePackage(selected.pkg);
      if (!info) return;
      await syncProfileTier(info);
      await refreshProfileTier();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
      Alert.alert("Welcome to Pro!", "Every stage is unlocked and you can follow as many universities as you like.", [
        { text: "Let's go", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      if (error?.userCancelled || error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return;
      console.error("Purchase failed:", error);
      Alert.alert("Purchase didn't go through", error?.message || "Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const restore = async () => {
    if (isWeb || isRestoring) return;
    setIsRestoring(true);
    try {
      const info = await restorePurchases();
      await syncProfileTier(info);
      await refreshProfileTier();
      const restored = getActiveSubscriptionTier(info) === "pro";
      Alert.alert(
        restored ? "Purchases restored" : "Nothing to restore",
        restored ? "UniPilot Pro is active again." : "We couldn't find an active subscription for this Apple ID.",
      );
    } catch (error: any) {
      Alert.alert("Restore failed", error?.message || "Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  const manage = () =>
    openAppleSubscriptionManager().catch(() =>
      Linking.openURL("https://apps.apple.com/account/subscriptions").catch(() => null),
    );

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Close" onPress={handleBack} style={styles.roundButton}>
          <X color={UI.text} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" disabled={isRestoring} onPress={restore} style={styles.restore}>
          {isRestoring ? (
            <ActivityIndicator color={UI.primary} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore</Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={UI.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: (pro ? 48 : 190) + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Sparkles color="#FFFFFF" size={26} strokeWidth={2} />
              </View>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>UniPilot Pro</Text>
              </View>
              <Text style={styles.heroTitle}>{pro ? "You're on Pro" : "Your whole move abroad, mapped"}</Text>
              <Text style={styles.heroText}>
                {pro
                  ? "Every stage, every tool and unlimited universities. Thanks for supporting UniPilot!"
                  : "Compare as many universities as you like and unlock every stage after your application: visa, travel, arrival and career."}
              </Text>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHead}>
                <View style={styles.tableLabelCol} />
                <Text style={[styles.tableHeadText, styles.tableCol]}>Free</Text>
                <Text style={[styles.tableHeadText, styles.tableCol, styles.tableHeadPro]}>Pro</Text>
              </View>
              {COMPARISON.map((row, index) => (
                <View key={row.label} style={[styles.tableRow, index > 0 && styles.tableDivider]}>
                  <Text style={[styles.tableLabel, styles.tableLabelCol]}>{row.label}</Text>
                  <Cell value={row.free} />
                  <Cell pro value={row.pro} />
                </View>
              ))}
            </View>

            {!pro && options.length > 1 ? (
              <>
                <Text style={styles.sectionTitle}>Choose how to pay</Text>
                <View style={styles.options}>
                  {options.map((option) => {
                    const active = option.key === selected?.key;
                    return (
                      <Pressable
                        key={option.key}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => null);
                          setSelectedKey(option.key);
                        }}
                        style={[styles.option, active && styles.optionActive]}
                      >
                        <View style={[styles.radio, active && styles.radioActive]}>
                          {active ? <View style={styles.radioDot} /> : null}
                        </View>
                        <View style={styles.optionCopy}>
                          <Text style={styles.optionLabel}>{option.label}</Text>
                          {option.note ? <Text style={styles.optionNote}>{option.note}</Text> : null}
                        </View>
                        <Text style={styles.optionPrice}>
                          {option.pkg.product.priceString}
                          <Text style={styles.optionPeriod}> / {periodLabel(option)}</Text>
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {pro ? (
              <TouchableOpacity accessibilityRole="button" onPress={manage} style={styles.manage}>
                <Text style={styles.manageText}>Manage or cancel subscription</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.legal}>
              Pro renews automatically at the price shown until cancelled. Payment is charged to your Apple ID at
              confirmation. Cancel any time in your App Store settings at least 24 hours before renewal.
            </Text>
            <View style={styles.legalLinks}>
              <Text onPress={() => WebBrowser.openBrowserAsync(TERMS_OF_USE_URL)} style={styles.legalLink}>
                Terms of Use (EULA)
              </Text>
              <Text style={styles.legalDot}>·</Text>
              <Text onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)} style={styles.legalLink}>
                Privacy Policy
              </Text>
            </View>
          </ScrollView>

          {!pro ? (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {storeUnavailable ? (
                <Text style={styles.storeNote}>Pro is temporarily unavailable. Please try again shortly.</Text>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.88}
                disabled={isProcessing || !selected}
                onPress={subscribe}
                style={[styles.cta, (isProcessing || !selected) && styles.ctaDisabled]}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.ctaText}>Get UniPilot Pro</Text>
                    <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.4} />
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.ctaNote}>
                {selected ? `${selected.pkg.product.priceString} / ${periodLabel(selected)} · ` : ""}Cancel anytime
              </Text>
            </View>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}

function Cell({ value, pro }: { value: boolean | string; pro?: boolean }) {
  return (
    <View style={styles.tableCol}>
      {value === true ? (
        <Check color={pro ? UI.primary : UI.success} size={17} strokeWidth={3} />
      ) : value === false ? (
        <Minus color={UI.track} size={17} strokeWidth={3} />
      ) : (
        <Text style={[styles.cellText, pro && styles.cellTextPro]}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 6,
    paddingHorizontal: GUTTER - 4,
    paddingTop: 6,
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
    ...CARD_SHADOW,
  },
  restore: {
    minWidth: 64,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  restoreText: {
    color: UI.primary,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: GUTTER,
  },
  hero: {
    alignItems: "center",
    marginTop: 4,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 22,
    height: 64,
    justifyContent: "center",
    shadowColor: UI.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    width: 64,
  },
  proBadge: {
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.pill,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  proBadgeText: {
    color: UI.primary,
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: UI.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 10,
    textAlign: "center",
  },
  heroText: {
    color: UI.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  table: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    marginTop: 24,
    paddingBottom: 4,
    paddingHorizontal: 14,
    ...CARD_SHADOW,
  },
  tableHead: {
    flexDirection: "row",
    paddingBottom: 8,
    paddingTop: 14,
  },
  tableHeadText: {
    color: UI.muted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  tableHeadPro: {
    color: UI.primary,
  },
  tableRow: {
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 12,
  },
  tableDivider: {
    borderTopColor: UI.hairline,
    borderTopWidth: 1,
  },
  tableLabelCol: {
    flex: 1,
  },
  tableCol: {
    alignItems: "center",
    width: 74,
  },
  tableLabel: {
    color: UI.text,
    fontSize: 14,
    fontWeight: "600",
    paddingRight: 8,
  },
  cellText: {
    color: UI.textSecondary,
    fontSize: 12.5,
    fontWeight: "700",
    textAlign: "center",
  },
  cellTextPro: {
    color: UI.primary,
  },
  sectionTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 26,
  },
  options: {
    gap: 10,
  },
  option: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  optionActive: {
    borderColor: UI.primary,
  },
  radio: {
    alignItems: "center",
    borderColor: UI.track,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  radioActive: {
    borderColor: UI.primary,
  },
  radioDot: {
    backgroundColor: UI.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "800",
  },
  optionNote: {
    color: UI.success,
    fontSize: 12.5,
    fontWeight: "800",
    marginTop: 2,
  },
  optionPrice: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "800",
  },
  optionPeriod: {
    color: UI.muted,
    fontSize: 12.5,
    fontWeight: "600",
  },
  manage: {
    alignItems: "center",
    borderColor: UI.border,
    borderRadius: 28,
    borderWidth: 1.5,
    marginTop: 22,
    paddingVertical: 15,
  },
  manageText: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "700",
  },
  legal: {
    color: UI.muted,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 24,
    textAlign: "center",
  },
  legalLinks: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  legalLink: {
    color: UI.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  legalDot: {
    color: UI.muted,
    fontSize: 12,
  },
  footer: {
    backgroundColor: UI.background,
    borderTopColor: UI.hairline,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: GUTTER,
    paddingTop: 12,
    position: "absolute",
    right: 0,
  },
  storeNote: {
    color: UI.muted,
    fontSize: 12.5,
    marginBottom: 8,
    textAlign: "center",
  },
  cta: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 28,
    flexDirection: "row",
    gap: 8,
    height: 56,
    justifyContent: "center",
    shadowColor: UI.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  ctaNote: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 8,
    textAlign: "center",
  },
});
