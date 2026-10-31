import React from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import OnboardingProgressHeader from "@/components/onboarding/OnboardingProgressHeader";

const worldMap = require("@/assets/images/onboarding/world-map-login.png");

type Props = {
  Icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  children: React.ReactNode;
};

/** Shared frame for the secondary auth screens (verify, reset, callback). */
export default function AuthShell({ Icon, title, subtitle, onBack, children }: Props) {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Image resizeMode="contain" source={worldMap} style={styles.map} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        {onBack ? <OnboardingProgressHeader hideProgress onBack={onBack} progress={0} /> : null}
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconRing}>
            <View style={styles.iconCircle}>
              <Icon color="#FFFFFF" size={30} strokeWidth={2} />
            </View>
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  map: {
    aspectRatio: 1,
    left: "-40%",
    opacity: 0.11,
    position: "absolute",
    top: -20,
    width: "277%",
  },
  content: {
    flexGrow: 1,
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  iconRing: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFF4F4",
    borderRadius: 52,
    height: 104,
    justifyContent: "center",
    width: 104,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    width: 72,
  },
  title: {
    color: "#111827",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 24,
    textAlign: "center",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  body: {
    marginTop: 28,
  },
});
