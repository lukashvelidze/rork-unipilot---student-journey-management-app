import React from "react";
import { Tabs } from "expo-router";
import { Home, Map, Crown, FileText, User } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";

export default function TabLayout() {
  const Colors = useColors();
  const { isDarkMode } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.lightText,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: Colors.background,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: "600",
          color: Colors.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: "Journey",
          tabBarIcon: ({ color }) => <Map size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Premium",
          tabBarIcon: ({ color }) => <Crown size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}