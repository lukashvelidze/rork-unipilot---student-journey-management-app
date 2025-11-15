import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Crown } from "lucide-react-native";

export default function PremiumTabScreen() {
  const Colors = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.placeholderContainer}>
          <Crown size={64} color={Colors.primary} />
          <Text style={[styles.placeholderTitle, { color: Colors.text }]}>
            Premium
          </Text>
          <Text style={[styles.placeholderDescription, { color: Colors.lightText }]}>
            Placeholder for future Paddle checkout integration
          </Text>
          
          {/* TODO: Add Paddle checkout integration here */}
          {/* After successful payment, display: */}
          {/* "Welcome to UniPilot Essential Plan ($4.99/month). You've unlocked all Journey Roadmap modules available after your acceptance letter." */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  placeholderDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
});
