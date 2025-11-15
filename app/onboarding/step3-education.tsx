import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, GraduationCap } from "lucide-react-native";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import { EducationLevel } from "@/types/user";

const educationLevels: { value: EducationLevel; label: string; description: string }[] = [
  { value: "high_school", label: "High School", description: "Currently in or completed high school" },
  { value: "bachelors", label: "Bachelor's Degree", description: "Pursuing or completed undergraduate studies" },
  { value: "masters", label: "Master's Degree", description: "Pursuing or completed graduate studies" },
  { value: "phd", label: "PhD", description: "Pursuing or completed doctoral studies" },
];

export default function Step3Education() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, updateOnboardingStep } = useUserStore();
  
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill if returning user
  useEffect(() => {
    if (user?.educationBackground?.level) {
      setSelectedLevel(user.educationBackground.level);
    }
  }, [user]);

  const handleContinue = async () => {
    if (!selectedLevel) {
      setError("Please select your education level");
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.replace("/onboarding/step1-account");
        return;
      }

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          level_of_study: selectedLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        setError("Failed to save. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Update local store
      if (user) {
        setUser({
          ...user,
          educationBackground: {
            ...user.educationBackground,
            level: selectedLevel,
          },
          onboardingStep: 4,
        });
      }

      // Navigate to next step
      router.push("/onboarding/step4-destination");
    } catch (error: any) {
      console.error("Error saving education level:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress bar */}
      <View style={[styles.progressContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "60%" }]} />
        </View>
        <Text style={styles.progressText}>Step 3 of 6</Text>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <View style={styles.iconContainer}>
            <GraduationCap size={48} color={Colors.primary} />
          </View>
          <Text style={styles.stepTitle}>What's your education level?</Text>
          <Text style={styles.stepDescription}>
            This helps us personalize your journey and provide relevant guidance
          </Text>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <View style={styles.optionsList}>
            {educationLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.optionCard,
                  selectedLevel === level.value && styles.selectedOptionCard
                ]}
                onPress={() => {
                  setSelectedLevel(level.value);
                  setError("");
                }}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    selectedLevel === level.value && styles.selectedOptionTitle
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    selectedLevel === level.value && styles.selectedOptionDescription
                  ]}>
                    {level.description}
                  </Text>
                </View>
                {selectedLevel === level.value && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed footer with buttons */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          loading={isProcessing}
          fullWidth
          icon={<ChevronRight size={20} color={Colors.white} />}
        />
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push("/onboarding/step4-destination")}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
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
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.lightText,
    marginBottom: 32,
    lineHeight: 24,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: 16,
    textAlign: "center",
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedOptionCard: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  selectedOptionTitle: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
  },
  selectedOptionDescription: {
    color: Colors.text,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  checkmarkText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  skipText: {
    fontSize: 14,
    color: Colors.lightText,
  },
});

