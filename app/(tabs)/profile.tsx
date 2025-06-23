import React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Settings, Crown } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Avatar from "@/components/Avatar";
import { useUserStore } from "@/store/userStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isPremium, logout } = useUserStore();
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Avatar
            size="large"
            name={user.name}
            showBorder
          />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={12} color="#FFD700" />
                <Text style={styles.premiumText}>Premium Member</Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settings")}
        >
          <Settings size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <Card style={styles.statsCard} variant="elevated" borderRadius="large">
        <Text style={styles.sectionTitle}>Journey Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Stages Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>
        </View>
      </Card>
      
      <Card style={styles.infoCard} variant="elevated" borderRadius="large">
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nationality</Text>
          <Text style={styles.infoValue}>{user.nationality}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Target Country</Text>
          <Text style={styles.infoValue}>{user.targetCountry}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Education Level</Text>
          <Text style={styles.infoValue}>{user.educationLevel}</Text>
        </View>
        <Button
          title="Edit Profile"
          onPress={() => router.push("/profile/edit")}
          variant="secondary"
          size="medium"
          fullWidth
          style={styles.editButton}
        />
      </Card>
      
      <View style={styles.actionsContainer}>
        <Button
          title="Settings"
          onPress={() => router.push("/settings")}
          variant="outline"
          size="medium"
          fullWidth
          style={styles.actionButton}
        />
        <Button
          title="Logout"
          onPress={logout}
          variant="destructive"
          size="medium"
          fullWidth
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 16,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameContainer: {
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: Colors.lightText,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  premiumText: {
    fontSize: 12,
    color: "#FFD700",
    marginLeft: 4,
    fontWeight: "600",
  },
  settingsButton: {
    padding: 10,
  },
  statsCard: {
    marginBottom: 24,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
  },
  infoCard: {
    marginBottom: 24,
    padding: 20,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.lightText,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
  editButton: {
    marginTop: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});