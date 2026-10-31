import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CreditCard,
  Crown,
  FileText,
  HelpCircle,
  LogOut,
  LucideIcon,
  MessageSquare,
  Shield,
  Star,
  Trash2,
  User,
} from "lucide-react-native";
import Avatar from "@/components/Avatar";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { useSignOut } from "@/hooks/useSignOut";
import { openAppleSubscriptionManager } from "@/lib/iap";
import { getPaddleCustomerId } from "@/lib/paddle-customer";
import { buildPaddleCustomerPortalUrl } from "@/lib/paddle";
import { getRemindersEnabled, setRemindersEnabled } from "@/lib/reminders";
import { useUserStore } from "@/store/userStore";

const SUPPORT_EMAIL = "unipilotapp@gmail.com";
const WEBSITE = "https://unipilot.app";

type Row = {
  id: string;
  title: string;
  subtitle?: string;
  Icon: LucideIcon;
  tint: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (value: boolean) => void; busy?: boolean };
  destructive?: boolean;
  disabled?: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const handleBack = useAppBack("/(tabs)/profile");
  const { user, isPremium } = useUserStore();
  const signOut = useSignOut();
  const { confirmDeleteAccount, isDeletingAccount } = useDeleteAccount();
  const [reminders, setReminders] = useState(true);
  const [remindersBusy, setRemindersBusy] = useState(false);
  const isIosDevice = Platform.OS === "ios";
  const version = Constants.expoConfig?.version ?? "1.0.0";

  useEffect(() => {
    getRemindersEnabled().then(setReminders);
  }, []);

  const toggleReminders = async (value: boolean) => {
    setRemindersBusy(true);
    setReminders(value);
    const enabled = await setRemindersEnabled(value);
    setReminders(enabled);
    setRemindersBusy(false);
    if (value && !enabled) {
      Alert.alert(
        "Notifications are off",
        "Allow notifications for UniPilot in Settings to get deadline reminders.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings().catch(() => null) },
        ],
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleRateApp = async () => {
    const reviewUrl = "https://apps.apple.com/app/id6748587544?action=write-review";
    try {
      await Linking.openURL(reviewUrl);
    } catch (error) {
      console.error("Open review failed:", error);
      Alert.alert("Unable to Open", "We couldn't open the App Store review page.");
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent(`UniPilot support (v${version})`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch(() =>
      Alert.alert("Contact support", `Email us at ${SUPPORT_EMAIL}`),
    );
  };

  const openPage = (path: string) =>
    WebBrowser.openBrowserAsync(`${WEBSITE}${path}`).catch(() =>
      Alert.alert("Unable to Open", "Please try again in a moment."),
    );

  const handleManageSubscription = async () => {
    if (!isIosDevice) {
      try {
        const customerId = await getPaddleCustomerId();
        if (!customerId) {
          Alert.alert(
            "Manage Subscription",
            "We couldn't find a subscription linked to your account. You can view plans or contact support.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "View Plans", onPress: () => router.push("/premium") },
              { text: "Contact Support", onPress: handleContactSupport },
            ],
          );
          return;
        }

        const portalUrl = buildPaddleCustomerPortalUrl(customerId);
        if (!portalUrl) {
          Alert.alert(
            "Manage Subscription",
            "Subscription management isn't configured yet. Please contact support for assistance.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Contact Support", onPress: handleContactSupport },
            ],
          );
          return;
        }
        await Linking.openURL(portalUrl);
      } catch (error) {
        console.error("Open Paddle portal failed", error);
        Alert.alert("Unable to Open", "We couldn't open the subscription portal.");
      }
      return;
    }

    try {
      await openAppleSubscriptionManager();
    } catch (error) {
      console.error("Open subscription manager failed", error);
      Alert.alert("Unable to Open", "We couldn't open Apple subscription settings.");
    }
  };

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: "Account",
      rows: [
        {
          id: "profile",
          title: "Edit Profile",
          subtitle: "Personal details, studies and goals",
          Icon: User,
          tint: UI.primary,
          onPress: () => router.push("/profile/edit"),
        },
        {
          id: "premium",
          title: isPremium ? "UniPilot Pro" : "Upgrade to Pro",
          subtitle: isPremium ? "See what's included in Pro" : "Unlimited universities and every stage",
          Icon: Crown,
          tint: UI.warning,
          onPress: () => router.push("/premium"),
        },
        ...(isPremium
          ? [
              {
                id: "subscription",
                title: "Manage Subscription",
                subtitle: isIosDevice ? "Update or cancel your App Store plan" : "Update or cancel your plan",
                Icon: CreditCard,
                tint: UI.success,
                onPress: handleManageSubscription,
              },
            ]
          : []),
      ],
    },
    {
      title: "Notifications",
      rows: [
        {
          id: "reminders",
          title: "Deadline reminders",
          subtitle: "Application deadlines and task due dates",
          Icon: Bell,
          tint: UI.success,
          toggle: { value: reminders, onChange: toggleReminders, busy: remindersBusy },
        },
      ],
    },
    {
      title: "Support",
      rows: [
        {
          id: "help",
          title: "Help Center",
          subtitle: "FAQs and guides",
          Icon: HelpCircle,
          tint: UI.primary,
          onPress: () => openPage("/"),
        },
        {
          id: "contact",
          title: "Contact Support",
          subtitle: "We usually reply within a day",
          Icon: MessageSquare,
          tint: UI.success,
          onPress: handleContactSupport,
        },
        {
          id: "rate",
          title: "Rate UniPilot",
          subtitle: "Share your feedback on the App Store",
          Icon: Star,
          tint: UI.warning,
          onPress: handleRateApp,
        },
      ],
    },
    {
      title: "Legal",
      rows: [
        {
          id: "privacy",
          title: "Privacy Policy",
          Icon: Shield,
          tint: UI.textSecondary,
          onPress: () => openPage("/privacy"),
        },
        {
          id: "terms",
          title: "Terms of Use",
          Icon: FileText,
          tint: UI.textSecondary,
          onPress: () => openPage("/terms"),
        },
      ],
    },
    {
      title: "Account actions",
      rows: [
        {
          id: "signout",
          title: "Sign Out",
          Icon: LogOut,
          tint: UI.textSecondary,
          onPress: handleLogout,
        },
        {
          id: "delete",
          title: isDeletingAccount ? "Deleting account…" : "Delete Account",
          subtitle: "Permanently delete your account and data",
          Icon: Trash2,
          tint: UI.danger,
          destructive: true,
          disabled: isDeletingAccount,
          onPress: confirmDeleteAccount,
        },
      ],
    },
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color={UI.text} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.userCard}>
          <Avatar color={UI.primary} imageUrl={user?.avatar} name={user?.name || "U"} size="large" />
          <View style={styles.userCopy}>
            <Text numberOfLines={1} style={styles.userName}>
              {user?.name || "Student"}
            </Text>
            <Text numberOfLines={1} style={styles.userEmail}>
              {user?.email}
            </Text>
            {isPremium ? (
              <View style={styles.premiumBadge}>
                <Crown color="#B7791F" size={12} strokeWidth={2.2} />
                <Text style={styles.premiumText}>Pro member</Text>
              </View>
            ) : null}
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, index) => (
                <SettingRow key={row.id} first={index === 0} row={row} />
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>UniPilot v{version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ row, first }: { row: Row; first: boolean }) {
  const { Icon } = row;
  const content = (
    <>
      <Icon color={row.destructive ? UI.danger : UI.primary} size={20} strokeWidth={1.8} />
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, row.destructive && styles.rowTitleDestructive]}>{row.title}</Text>
        {row.subtitle ? <Text style={styles.rowSubtitle}>{row.subtitle}</Text> : null}
      </View>
      {row.toggle ? (
        row.toggle.busy ? (
          <ActivityIndicator color={UI.primary} />
        ) : (
          <Switch
            accessibilityLabel={row.title}
            onValueChange={row.toggle.onChange}
            trackColor={{ false: UI.track, true: UI.primary }}
            value={row.toggle.value}
          />
        )
      ) : row.destructive ? null : (
        <ChevronRight color={UI.muted} size={18} strokeWidth={2} />
      )}
    </>
  );

  if (row.toggle) {
    return <View style={[styles.row, !first && styles.rowDivider]}>{content}</View>;
  }
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      disabled={row.disabled}
      onPress={row.onPress}
      style={[styles.row, !first && styles.rowDivider, row.disabled && styles.rowDisabled]}
    >
      {content}
    </TouchableOpacity>
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
    paddingBottom: 10,
    paddingHorizontal: GUTTER - 4,
    paddingTop: 6,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
    ...CARD_SHADOW,
  },
  headerTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingBottom: 48,
    paddingHorizontal: GUTTER,
    paddingTop: 8,
  },
  userCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    flexDirection: "row",
    gap: 14,
    padding: 16,
    ...CARD_SHADOW,
  },
  userCopy: {
    flex: 1,
  },
  userName: {
    color: UI.text,
    fontSize: 18,
    fontWeight: "800",
  },
  userEmail: {
    color: UI.textSecondary,
    fontSize: 13.5,
    marginTop: 2,
  },
  premiumBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: UI.warningSoft,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumText: {
    color: "#B7791F",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    ...CARD_SHADOW,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    minHeight: 58,
    paddingVertical: 13,
  },
  rowDivider: {
    borderTopColor: UI.hairline,
    borderTopWidth: 1,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "500",
  },
  rowTitleDestructive: {
    color: UI.danger,
  },
  rowSubtitle: {
    color: UI.muted,
    fontSize: 12,
    marginTop: 2,
  },
  version: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 28,
    textAlign: "center",
  },
});
