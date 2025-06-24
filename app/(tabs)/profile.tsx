import React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Settings, Crown, Edit, MapPin, GraduationCap, Target, Calendar } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Avatar from "@/components/Avatar";
import { useUserStore } from "@/store/userStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isPremium, logout } = useUserStore();
  
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User data not available. Please log in.</Text>
        <Button
          title="Logout"
          onPress={logout}
          variant="destructive"
          size="medium"
          fullWidth
          style={styles.actionButton}
        />
      </View>
    );
  }

  const profileStats = [
    {
      label: "Journey Progress",
      value: "65%",
      color: Colors.primary,
    },
    {
      label: "Tasks Completed",
      value: "12",
      color: Colors.success,
    },
    {
      label: "Documents",
      value: "5",
      color: Colors.accent,
    },
  ];

  const quickActions = [
    {
      title: "Edit Profile",
      subtitle: "Update your information",
      icon: Edit,
      color: Colors.primary,
      onPress: () => router.push("/profile/edit"),
    },
    {
      title: "Settings",
      subtitle: "Preferences and privacy",
      icon: Settings,
      color: Colors.secondary,
      onPress: () => router.push("/settings"),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with Avatar and Basic Info */}
      <Card style={styles.headerCard} variant="elevated">
        <View style={styles.profileHeader}>
          <Avatar
            size="large"
            name={user.name}
            showBorder
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={14} color={Colors.premium} />
                <Text style={styles.premiumText}>Premium Member</Text>
              </View>
            )}
          </View>
        </View>
        
        {user.bio && (
          <Text style={styles.bio}>{user.bio}</Text>
        )}
      </Card>
      
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {profileStats.map((stat, index) => (
          <Card key={index} style={styles.statCard} variant="default">
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={action.onPress}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
              <action.icon size={24} color={action.color} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Profile Information */}
      <Card style={styles.infoCard} variant="default">
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MapPin size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>From</Text>
              <Text style={styles.infoValue}>
                {user.homeCountry?.name || "Not set"}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Target size={18} color={Colors.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Studying in</Text>
              <Text style={styles.infoValue}>
                {user.destinationCountry?.name || "Not set"}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <GraduationCap size={18} color={Colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Education Level</Text>
              <Text style={styles.infoValue}>
                {user.educationBackground?.level || "Not set"}
              </Text>
            </View>
          </View>
          
          {user.careerGoal && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Target size={18} color={Colors.success} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Career Interest</Text>
                <Text style={styles.infoValue}>{user.careerGoal}</Text>
              </View>
            </View>
          )}
        </View>
      </Card>
      
      {/* Premium Upgrade (if not premium) */}
      {!isPremium && (
        <Card style={styles.upgradeCard} variant="elevated">
          <View style={styles.upgradeContent}>
            <Crown size={32} color={Colors.premium} />
            <Text style={styles.upgradeTitle}>Unlock Premium Features</Text>
            <Text style={styles.upgradeDescription}>
              Get access to AI assistance, premium resources, and personalized guidance.
            </Text>
            <Button
              title="Upgrade to Premium"
              onPress={() => router.push("/premium")}
              style={styles.upgradeButton}
            />
          </View>
        </Card>
      )}
      
      {/* Sign Out Button */}
      <Button
        title="Sign Out"
        onPress={logout}
        variant="outline"
        size="medium"
        fullWidth
        style={styles.signOutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    marginBottom: 20,
    padding: 24,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 8,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.premiumBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  premiumText: {
    fontSize: 12,
    color: Colors.premium,
    marginLeft: 4,
    fontWeight: "600",
  },
  bio: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.lightText,
    textAlign: "center",
  },
  quickActions: {
    marginBottom: 20,
    gap: 12,
  },
  actionCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    ...Theme.shadow.small,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.lightText,
  },
  infoCard: {
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.lightText,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  upgradeCard: {
    marginBottom: 20,
    padding: 24,
    backgroundColor: Colors.premiumBackground,
    borderWidth: 1,
    borderColor: Colors.premium,
  },
  upgradeContent: {
    alignItems: "center",
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButton: {
    minWidth: 200,
  },
  signOutButton: {
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 8,
  },
});