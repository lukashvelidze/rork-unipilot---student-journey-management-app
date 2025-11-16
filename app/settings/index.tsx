import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  MessageSquare, 
  Star, 
  LogOut, 
  ChevronRight,
  Moon,
  Globe,
  Download,
  Trash2,
  Crown,
  MapPin,
  Home
} from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import CountrySelector from "@/components/CountrySelector";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import { countries } from "@/mocks/countries";
import { Country } from "@/types/user";
import { supabase } from "@/lib/supabase";
import { updateProfile } from "@/lib/supabase";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  iconColor: string;
  type: "navigation" | "toggle" | "action" | "country_selector";
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
  country?: Country | null;
  onCountryChange?: (country: Country) => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, logout, isPremium, updateDestinationCountry, updateHomeCountry } = useUserStore();
  const { refreshJourney } = useJourneyStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  
  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);
  const [showHomeSelector, setShowHomeSelector] = useState(false);
  
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
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Handle account deletion
            Alert.alert("Account Deleted", "Your account has been deleted.");
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
    Alert.alert(
      "Contact Support",
      "How would you like to contact our support team?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Email", onPress: () => console.log("Open email") },
        { text: "Chat", onPress: () => console.log("Open chat") },
      ]
    );
  };
  
  const handleDestinationCountryChange = (country: Country) => {
    Alert.alert(
      "Change Destination Country",
      `Changing your destination to ${country.name} will update your journey tasks and requirements with country-specific visa processes, document requirements, and regulations. This action cannot be undone. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          style: "default",
          onPress: async () => {
            try {
              console.log("Updating destination country to:", country.name);
              
              // Get authenticated user
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (!authUser) {
                Alert.alert("Error", "You must be logged in to update your destination country.");
                return;
              }
              
              // Update the database profile
              const { error: updateError } = await updateProfile({
                destination_country: country.code,
              });
              
              if (updateError) {
                console.error("Error updating profile:", updateError);
                Alert.alert("Error", "Failed to update destination country in database. Please try again.");
                return;
              }
              
              // Update the destination country in user store (this will also update journey progress)
              updateDestinationCountry(country);
              
              // Force refresh the journey store
              setTimeout(() => {
                refreshJourney();
              }, 100);
              
              setShowDestinationSelector(false);
              
              Alert.alert(
                "Destination Updated",
                `Your destination has been changed to ${country.flag} ${country.name}. Your journey tasks have been updated with country-specific requirements including visa processes, document checklists, and local regulations.`,
                [{ 
                  text: "View Updated Tasks", 
                  onPress: () => router.push("/(tabs)/journey")
                }]
              );
            } catch (error) {
              console.error("Error updating destination country:", error);
              Alert.alert("Error", "Failed to update destination country. Please try again.");
            }
          },
        },
      ]
    );
  };
  
  const handleHomeCountryChange = async (country: Country) => {
    try {
      // Get authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        Alert.alert("Error", "You must be logged in to update your home country.");
        return;
      }
      
      // Update the database profile
      const { error: updateError } = await updateProfile({
        country_origin: country.code,
      });
      
      if (updateError) {
        console.error("Error updating profile:", updateError);
        Alert.alert("Error", "Failed to update home country in database. Please try again.");
        return;
      }
      
      // Update the home country in user store
      updateHomeCountry(country);
      setShowHomeSelector(false);
      
      Alert.alert(
        "Home Country Updated",
        `Your home country has been changed to ${country.flag} ${country.name}.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error updating home country:", error);
      Alert.alert("Error", "Failed to update home country. Please try again.");
    }
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
      title: "Journey Settings",
      items: [
        {
          id: "homeCountry",
          title: "Home Country",
          subtitle: user?.homeCountry?.name || "Not set",
          icon: Home,
          iconColor: Colors.secondary,
          type: "navigation",
          onPress: () => setShowHomeSelector(true),
        },
        {
          id: "destinationCountry",
          title: "Destination Country",
          subtitle: user?.destinationCountry?.name ? `${user.destinationCountry.flag} ${user.destinationCountry.name}` : "Not set",
          icon: MapPin,
          iconColor: Colors.accent,
          type: "navigation",
          onPress: () => setShowDestinationSelector(true),
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
          onPress: () => Alert.alert("Coming Soon", "Help center will be available soon."),
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
      
      {/* Country Selectors */}
      {showDestinationSelector && (
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: Colors.card }]}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Change Destination Country</Text>
            <Text style={[styles.modalSubtitle, { color: Colors.lightText }]}>
              This will update your journey tasks with country-specific visa requirements, document checklists, and regulations.
            </Text>
            <CountrySelector
              label="Select Destination Country"
              value={user?.destinationCountry || null}
              onChange={handleDestinationCountryChange}
              countries={countries}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowDestinationSelector(false)}
                variant="outline"
                style={styles.modalButton}
              />
            </View>
          </Card>
        </View>
      )}
      
      {showHomeSelector && (
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: Colors.card }]}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>Change Home Country</Text>
            <CountrySelector
              label="Select Home Country"
              value={user?.homeCountry || null}
              onChange={handleHomeCountryChange}
              countries={countries}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowHomeSelector(false)}
                variant="outline"
                style={styles.modalButton}
              />
            </View>
          </Card>
        </View>
      )}
      
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  modalButton: {
    marginLeft: 12,
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