import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Image, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import { formatEnumValue } from "@/utils/safeStringOps";

export default function Step6Finish() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, completeOnboarding } = useUserStore();
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGetStarted = async () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.replace("/onboarding/step1-account");
        return;
      }

      // Update profile in Supabase - ensure updated_at is set
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        Alert.alert("Error", "Failed to complete onboarding. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Optionally initialize user_progress for checklist items
      // Fetch checklist items for the selected visa type
      if (user?.destinationCountry && user?.destinationCountry.code) {
        try {
          // Get the visa type from profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("visa_type")
            .eq("id", authUser.id)
            .single();

          if (profile?.visa_type && user?.destinationCountry?.code) {
            // Get checklists for this country and visa type
            const { data: checklists } = await supabase
              .from("checklists")
              .select("id")
              .eq("country_code", user.destinationCountry.code)
              .eq("visa_type", profile.visa_type);

            if (checklists && checklists.length > 0) {
              // Get all checklist items for these checklists
              const checklistIds = checklists.map(c => c.id);
              const { data: checklistItems } = await supabase
                .from("checklist_items")
                .select("id")
                .in("checklist_id", checklistIds);

              if (checklistItems && checklistItems.length > 0) {
                // Initialize user_progress for each checklist item
                // authUser is already verified at the start of handleGetStarted
                const progressInserts = checklistItems.map(item => ({
                  user_id: authUser.id, // MUST match auth.uid() - verified above
                  checklist_item_id: item.id,
                  is_completed: false,
                  value: null,
                }));

                const { error: progressError } = await supabase
                  .from("user_progress")
                  .insert(progressInserts);

                if (progressError) {
                  console.error("Error initializing user progress:", progressError);
                  // Don't block onboarding completion if this fails
                } else {
                  console.log(`Initialized ${progressInserts.length} checklist items for user`);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error initializing checklist progress:", error);
          // Don't block onboarding completion if this fails
        }
      }

      // Update local store
      if (user) {
        setUser({
          ...user,
          onboardingCompleted: true,
        });
        completeOnboarding();
      }

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
        <Text style={styles.progressText}>Step 6 of 6</Text>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
            style={styles.welcomeImage}
            resizeMode="cover"
          />
          
          <Text style={styles.stepTitle}>You're all set!</Text>
          <Text style={styles.stepDescription}>
            We've created your personalized journey from {user?.homeCountry?.name || "your country"} to {user?.destinationCountry?.name || "your destination"}.
            {"\n\n"}
            Your journey includes country-specific visa requirements, document checklists, and step-by-step guidance tailored for {user?.destinationCountry?.name || "your destination"}.
          </Text>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Your Journey Summary</Text>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Home Country:</Text>
              <Text style={styles.summaryValue}>
                {user?.homeCountry?.flag} {user?.homeCountry?.name || "Not set"}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Destination:</Text>
              <Text style={styles.summaryValue}>
                {user?.destinationCountry?.flag} {user?.destinationCountry?.name || "Not set"}
              </Text>
            </View>

            {user?.educationBackground?.level && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Education Level:</Text>
                <Text style={styles.summaryValue}>
                  {formatEnumValue(user.educationBackground.level)}
                </Text>
              </View>
            )}

            {user?.email && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Email:</Text>
                <Text style={styles.summaryValue}>{user.email}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed footer with buttons */}
      <View style={styles.footer}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          loading={isProcessing}
          fullWidth
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.lightBackground,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "right",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  welcomeImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.lightText,
    marginBottom: 32,
    lineHeight: 24,
    textAlign: "center",
  },
  summaryContainer: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.lightText,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
  },
  footer: {
    padding: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

