import React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Settings, Crown, Edit, MapPin, GraduationCap, Target, Calendar } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Avatar from "@/components/Avatar";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useDocumentStore } from "@/store/documentStore";

export default function ProfileScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, isPremium, logout } = useUserStore();
  const { journeyProgress } = useJourneyStore();
  const { documents } = useDocumentStore();
  
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
        <Text style={[styles.errorText, { color: Colors.text }]}>User data not available. Please log in.</Text>
        <Button
          title="Logout"
          onPress={logout}
          variant="destructive"
          size="medium"
          fullWidth
          style={styles.actionButton}
        />
      </SafeAreaView>
    );
  }

  // Calculate real stats from stores
  const calculateJourneyProgress = () => {
    if (journeyProgress.length === 0) return 0;
    
    const totalTasks = journeyProgress.reduce((sum, stage) => sum + stage.tasks.length, 0);
    const completedTasks = journeyProgress.reduce((sum, stage) => 
      sum + stage.tasks.filter(task => task.completed).length, 0
    );
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const calculateCompletedTasks = () => {
    return journeyProgress.reduce((sum, stage) => 
      sum + stage.tasks.filter(task => task.completed).length, 0
    );
  };

  const actualJourneyProgress = calculateJourneyProgress();
  const actualCompletedTasks = calculateCompletedTasks();
  const actualDocumentCount = documents.length;

  const profileStats = [
    {
      label: "Journey Progress",
      value: `${actualJourneyProgress}%`,
      color: Colors.primary,
    },
    {
      label: "Tasks Completed",
      value: actualCompletedTasks.toString(),
      color: Colors.success,
    },
    {
      label: "Documents",
      value: actualDocumentCount.toString(),
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
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        {/* Header with Avatar and Basic Info */}
        <Card style={[styles.headerCard, { backgroundColor: Colors.card }]} variant="elevated">
          <View style={styles.profileHeader}>
            <Avatar
              size="large"
              name={user.name}
              showBorder
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: Colors.text }]}>{user.name}</Text>
              <Text style={[styles.email, { color: Colors.lightText }]}>{user.email}</Text>
              {isPremium && (
                <View style={[styles.premiumBadge, { backgroundColor: Colors.premiumBackground }]}>
                  <Crown size={14} color={Colors.premium} />
                  <Text style={[styles.premiumText, { color: Colors.premium }]}>Premium Member</Text>
                </View>
              )}
            </View>
          </View>
          
          {user.bio && (
            <Text style={[styles.bio, { color: Colors.lightText }]}>{user.bio}</Text>
          )}
        </Card>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {profileStats.map((stat, index) => (
            <Card key={index} style={[styles.statCard, { backgroundColor: Colors.card }]} variant="default">
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: Colors.lightText }]}>{stat.label}</Text>
            </Card>
          ))}
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: Colors.card }]}
              onPress={action.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: Colors.text }]}>{action.title}</Text>
                <Text style={[styles.actionSubtitle, { color: Colors.lightText }]}>{action.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Profile Information */}
        <Card style={[styles.infoCard, { backgroundColor: Colors.card }]} variant="default">
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Profile Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: Colors.surface }]}>
                <MapPin size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: Colors.lightText }]}>From</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>
                  {user.homeCountry?.name || "Not set"}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: Colors.surface }]}>
                <Target size={18} color={Colors.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: Colors.lightText }]}>Studying in</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>
                  {user.destinationCountry?.name || "Not set"}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: Colors.surface }]}>
                <GraduationCap size={18} color={Colors.accent} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: Colors.lightText }]}>Education Level</Text>
                <Text style={[styles.infoValue, { color: Colors.text }]}>
                  {user.educationBackground?.level || "Not set"}
                </Text>
              </View>
            </View>
            
            {user.careerGoal && (
              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: Colors.surface }]}>
                  <Target size={18} color={Colors.success} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: Colors.lightText }]}>Career Interest</Text>
                  <Text style={[styles.infoValue, { color: Colors.text }]}>{user.careerGoal}</Text>
                </View>
              </View>
            )}
          </View>
        </Card>
        
        {/* Premium Upgrade (if not premium) */}
        {!isPremium && (
          <Card style={[styles.upgradeCard, { backgroundColor: Colors.premiumBackground, borderColor: Colors.premium }]} variant="elevated">
            <View style={styles.upgradeContent}>
              <Crown size={32} color={Colors.premium} />
              <Text style={[styles.upgradeTitle, { color: Colors.text }]}>Unlock Premium Features</Text>
              <Text style={[styles.upgradeDescription, { color: Colors.lightText }]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
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
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  premiumText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  bio: {
    fontSize: 14,
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
    textAlign: "center",
  },
  quickActions: {
    marginBottom: 20,
    gap: 12,
  },
  actionCard: {
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
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  infoCard: {
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  upgradeCard: {
    marginBottom: 20,
    padding: 24,
    borderWidth: 1,
  },
  upgradeContent: {
    alignItems: "center",
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
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
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 8,
  },
});