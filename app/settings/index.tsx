import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Switch, Linking } from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Bell,
  HelpCircle,
  MessageSquare,
  Star,
  LogOut,
  ChevronRight,
  Moon,
  Globe,
  Download,
  Trash2,
  Crown
} from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  iconColor: string;
  type: "navigation" | "toggle" | "action";
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, logout, isPremium } = useUserStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  
  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            // Sign out from Supabase
            const { signOut } = await import("@/lib/supabase");
            await signOut();
            router.replace("/onboarding/step1-account");
          },
        },
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    if (isDeletingAccount) return;

    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (isDeletingAccount) return;
            setIsDeletingAccount(true);
            try {
              const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
              if (authError || !authUser) {
                throw new Error(authError?.message || "Not authenticated");
              }

              const userId = authUser.id;

              // Delete user-owned rows first
              const deletions = [
                supabase.from("memories").delete().eq("user_id", userId),
                supabase.from("documents").delete().eq("user_id", userId),
                supabase.from("user_progress").delete().eq("user_id", userId),
                supabase.from("user_subscriptions").delete().eq("user_id", userId),
                supabase.from("user_subscription_status").delete().eq("user_id", userId),
              ];
              await Promise.all(deletions);

              // Remove profile entry last
              await supabase.from("profiles").delete().eq("id", userId);

              // Sign out and clear local state
              await supabase.auth.signOut();
              await logout();

              Alert.alert("Account Deleted", "Your account has been deleted.", [
                {
                  text: "OK",
                  onPress: () => router.replace("/onboarding/step1-account"),
                },
              ]);
            } catch (error: any) {
              console.error("Delete account error:", error);
              Alert.alert("Error", error?.message || "Failed to delete account. Please try again.");
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };
  
  const handleRateApp = () => {
    Alert.alert(
      "Rate UniPilot",
      "Would you like to rate UniPilot on the App Store?",
      [
        { text: "Not Now", style: "cancel" },
        { text: "Rate App", onPress: () => console.log("Open app store") },
      ]
    );
  };
  
  const handleContactSupport = () => {
    Linking.openURL("mailto:unipilotapp@gmail.com").catch(() =>
      Alert.alert("Error", "Unable to open mail app.")
    );
  };

  const settingSections = [
    {
      title: "Account",
      items: [
        {
          id: "profile",
          title: "Edit Profile",
          subtitle: "Update your personal information",
          icon: User,
          iconColor: Colors.primary,
          type: "navigation",
          onPress: () => router.push("/profile/edit"),
        },
        {
          id: "premium",
          title: isPremium ? "Premium Active" : "Upgrade to Premium",
          subtitle: isPremium ? "Manage your premium subscription" : "Unlock all features",
          icon: Crown,
          iconColor: Colors.premium,
          type: "navigation",
          onPress: () => router.push("/premium"),
        },
      ] as SettingItem[],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "notifications",
          title: "Push Notifications",
          subtitle: "Receive updates and reminders",
          icon: Bell,
          iconColor: Colors.success,
          type: "toggle",
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: "darkMode",
          title: "Dark Mode",
          subtitle: "Switch to dark theme",
          icon: Moon,
          iconColor: Colors.secondary,
          type: "toggle",
          value: isDarkMode,
          onToggle: toggleDarkMode,
        },
        {
          id: "language",
          title: "Language",
          subtitle: "English",
          icon: Globe,
          iconColor: Colors.accent,
          type: "navigation",
          onPress: () => Alert.alert("Coming Soon", "Language settings will be available soon."),
        },
        {
          id: "autoDownload",
          title: "Auto-download Resources",
          subtitle: "Automatically download new premium resources",
          icon: Download,
          iconColor: Colors.info,
          type: "toggle",
          value: autoDownload,
          onToggle: setAutoDownload,
        },
      ] as SettingItem[],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          title: "Help Center",
          subtitle: "FAQs and guides",
          icon: HelpCircle,
          iconColor: Colors.info,
          type: "navigation",
          onPress: () => Linking.openURL("https://unipilot.app/faqs").catch(() => 
            Alert.alert("Error", "Unable to open link.")
          ),
        },
        {
          id: "contact",
          title: "Contact Support",
          subtitle: "Get help from our team",
          icon: MessageSquare,
          iconColor: Colors.accent,
          type: "navigation",
          onPress: handleContactSupport,
        },
        {
          id: "rate",
          title: "Rate UniPilot",
          subtitle: "Share your feedback",
          icon: Star,
          iconColor: Colors.warning,
          type: "navigation",
          onPress: handleRateApp,
        },
      ] as SettingItem[],
    },
    {
      title: "Account Actions",
      items: [
        {
          id: "logout",
          title: "Sign Out",
          icon: LogOut,
          iconColor: Colors.lightText,
          type: "action",
          onPress: handleLogout,
        },
        {
          id: "delete",
          title: "Delete Account",
          subtitle: "Permanently delete your account",
          icon: Trash2,
          iconColor: Colors.error,
          type: "action",
          destructive: true,
          onPress: handleDeleteAccount,
        },
      ] as SettingItem[],
    },
  ];
  
  const renderSettingItem = (item: SettingItem) => {
    const IconComponent = item.icon;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          item.destructive && styles.settingItemDestructive,
        ]}
        onPress={item.onPress}
        disabled={item.type === "toggle"}
      >
        <View style={styles.settingItemLeft}>
          <View style={[styles.settingIcon, { backgroundColor: `${item.iconColor}15` }]}>
            <IconComponent size={20} color={item.iconColor} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[
              styles.settingTitle,
              { color: Colors.text },
              item.destructive && styles.settingTitleDestructive,
            ]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: Colors.lightText }]}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.settingItemRight}>
          {item.type === "toggle" && item.onToggle ? (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={item.value ? Colors.white : Colors.lightText}
            />
          ) : item.type === "navigation" ? (
            <ChevronRight size={20} color={Colors.lightText} />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]} contentContainerStyle={styles.content}>
      {/* User Info Header */}
      <Card style={[styles.userCard, { backgroundColor: Colors.card }]} variant="elevated">
        <View style={styles.userInfo}>
          <View style={[styles.userAvatar, { backgroundColor: Colors.primary }]}>
            <Text style={styles.userAvatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: Colors.text }]}>{user?.name || "User"}</Text>
            <Text style={[styles.userEmail, { color: Colors.lightText }]}>{user?.email || "user@example.com"}</Text>
            {isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: Colors.premiumBackground }]}>
                <Crown size={12} color={Colors.premium} />
                <Text style={[styles.premiumText, { color: Colors.premium }]}>Premium Member</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
      
      {/* Settings Sections */}
      {settingSections.map((section, sectionIndex) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>{section.title}</Text>
          <Card style={[styles.sectionCard, { backgroundColor: Colors.card }]} variant="default">
            {section.items.map((item, itemIndex) => (
              <View key={item.id}>
                {renderSettingItem(item)}
                {itemIndex < section.items.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: Colors.divider }]} />
                )}
              </View>
            ))}
          </Card>
        </View>
      ))}
      
      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: Colors.lightText }]}>UniPilot v1.0.0</Text>
        <Text style={[styles.versionSubtext, { color: Colors.mutedText }]}>Made with ❤️ for students worldwide</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    marginBottom: 24,
    padding: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  premiumText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingItemDestructive: {
    // No special styling needed, handled by text color
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingTitleDestructive: {
    color: "#FF5252",
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingItemRight: {
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
  },
});
