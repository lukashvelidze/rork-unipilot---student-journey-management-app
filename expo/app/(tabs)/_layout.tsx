import React from "react";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { CheckCircle2, FileText, Navigation, User } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/store/themeStore";

export default function TabLayout() {
  const Colors = useColors();
  const { isDarkMode } = useThemeStore();
  const glassBorder = isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.76)";
  const lowerGlass = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.20)";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#A0A0B0",
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <View style={styles.glassShell}>
            <BlurView
              intensity={Platform.OS === "ios" ? 82 : 54}
              tint={isDarkMode ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.glassWash, { backgroundColor: lowerGlass }]} />
            <View style={[styles.glassHighlight, { borderColor: glassBorder }]} />
          </View>
        ),
        tabBarStyle: {
          position: "absolute",
          left: 22,
          right: 22,
          bottom: 18,
          height: 66,
          backgroundColor: "transparent",
          borderColor: "transparent",
          borderTopColor: "transparent",
          borderTopWidth: 0,
          borderWidth: 0,
          borderRadius: 33,
          overflow: "hidden",
          paddingTop: 8,
          paddingBottom: 8,
          ...Platform.select({
            ios: {
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: isDarkMode ? 0.38 : 0.16,
              shadowRadius: 28,
            },
            android: {
              elevation: 14,
            },
          }),
        },
        tabBarItemStyle: {
          height: 50,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 3,
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
          title: "Journey",
          tabBarIcon: ({ color }) => <Navigation size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <CheckCircle2 size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          title: "Resources",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
          headerShown: false,
          href: null,
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

const styles = StyleSheet.create({
  glassShell: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 33,
    overflow: "hidden",
  },
  glassWash: {
    ...StyleSheet.absoluteFillObject,
  },
  glassHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 33,
    borderWidth: 1,
    borderTopWidth: 1.5,
  },
});
