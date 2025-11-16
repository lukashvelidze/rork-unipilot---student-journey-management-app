import React from "react";
import { StyleSheet, View, Text, Image, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Button from "@/components/Button";

export default function Step0Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    router.push("/onboarding/step1-account");
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeContainer}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
            style={styles.welcomeImage}
            resizeMode="cover"
          />
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Welcome to UniPilot</Text>
            <Text style={styles.welcomeText}>
              Your personal guide through the entire international student journey, from university applications to career establishment worldwide.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed footer with buttons */}
      <View style={styles.footer}>
        <Button
          title="Get Started"
          onPress={handleContinue}
          fullWidth
          icon={<ChevronRight size={20} color={Colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  welcomeImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 32,
  },
  welcomeContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  footer: {
    padding: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

