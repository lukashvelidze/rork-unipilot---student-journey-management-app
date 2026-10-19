import React from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Button from "@/components/Button";
import AnimatedGlobe from "@/components/onboarding/AnimatedGlobe";

export default function Step0Welcome() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const isCompact = height < 760;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={[styles.illustration, isCompact && styles.compactIllustration]}>
        <AnimatedGlobe compact={isCompact} />
      </View>

      <View style={[styles.copy, isCompact && styles.compactCopy]}>
        <Text style={styles.title}>Let’s get started!</Text>
        <Text style={[styles.description, isCompact && styles.compactDescription]}>
          <Text style={styles.brand}>UniPilot</Text>
          {" helps students track the full move abroad process from application to arrival."}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          fullWidth
          onPress={() => router.push("/onboarding/step1-account")}
          style={styles.primaryButton}
          testID="get-started-register"
          title="Register"
        />
        <Button
          fullWidth
          onPress={() => router.push("/sign-in")}
          style={styles.secondaryButton}
          testID="get-started-login"
          textStyle={styles.secondaryButtonText}
          title="Log in"
          variant="outline"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  illustration: {
    marginTop: 16,
    width: "100%",
  },
  compactIllustration: {
    marginTop: 6,
  },
  copy: {
    alignItems: "center",
    marginTop: 54,
    paddingHorizontal: 24,
  },
  compactCopy: {
    marginTop: 18,
  },
  title: {
    color: "#374151",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.35,
    textAlign: "center",
  },
  description: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 18,
    marginTop: 58,
    maxWidth: 354,
    textAlign: "center",
  },
  compactDescription: {
    marginTop: 24,
  },
  brand: {
    color: "#FF6B6B",
  },
  actions: {
    gap: 16,
    marginTop: "auto",
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  primaryButton: {
    borderRadius: 24,
    height: 56,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FF6B6B",
    borderRadius: 24,
    height: 56,
  },
  secondaryButtonText: {
    color: "#FF6B6B",
  },
});
