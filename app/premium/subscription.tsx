import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { CreditCard } from "lucide-react-native";

export default function SubscriptionScreen() {
  const Colors = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.placeholderContainer}>
          <CreditCard size={64} color={Colors.primary} />
          <Text style={[styles.placeholderTitle, { color: Colors.text }]}>
            Subscription Management
          </Text>
          <Text style={[styles.placeholderDescription, { color: Colors.lightText }]}>
            This feature has been removed
          </Text>
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
