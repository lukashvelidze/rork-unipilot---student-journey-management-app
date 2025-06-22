import React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Settings, LogOut, User, School, Flag, CreditCard, Calendar, Award } from "lucide-react-native";
import Colors from "@/constants/colors";
import Avatar from "@/components/Avatar";
import Card from "@/components/Card";
import { useUserStore } from "@/store/userStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useUserStore();
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: () => {
            logout();
            router.replace("/onboarding");
          },
          style: "destructive",
        },
      ]
    );
  };
  
  if (!user) {
    router.replace("/onboarding");
    return null;
  }
  
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
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settings")}
        >
          <Settings size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/personal")}
          >
            <View style={styles.menuIcon}>
              <User size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Personal Information</Text>
              <Text style={styles.menuDescription}>
                Update your name, email, and contact details
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/education")}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.secondaryLight }]}>
              <School size={20} color={Colors.secondary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Education</Text>
              <Text style={styles.menuDescription}>
                Manage your academic information and test scores
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/countries")}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#E8F5E9" }]}>
              <Flag size={20} color="#4CAF50" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Countries</Text>
              <Text style={styles.menuDescription}>
                Update your home and destination countries
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/budget")}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#FFF3E0" }]}>
              <CreditCard size={20} color="#FF9800" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Budget</Text>
              <Text style={styles.menuDescription}>
                Set and manage your study abroad budget
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/timeline")}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#E8EAF6" }]}>
              <Calendar size={20} color="#3F51B5" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Timeline</Text>
              <Text style={styles.menuDescription}>
                Update your target dates and milestones
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/goals")}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#FCE4EC" }]}>
              <Award size={20} color="#E91E63" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Career Goals</Text>
              <Text style={styles.menuDescription}>
                Define your career objectives and aspirations
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      </View>
      
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <LogOut size={20} color={Colors.error} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.version}>UniPilot v1.0.0</Text>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.lightText,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  card: {
    padding: 0,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: Colors.lightText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginBottom: 24,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.error,
  },
  footer: {
    alignItems: "center",
    marginBottom: 16,
  },
  version: {
    fontSize: 14,
    color: Colors.lightText,
  },
});