import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Award,
  BookOpen,
  Globe2,
  GraduationCap,
  MoreHorizontal,
  School,
  type LucideIcon,
} from "lucide-react-native";
import Button from "@/components/Button";
import OnboardingChoiceCard from "@/components/onboarding/OnboardingChoiceCard";
import OnboardingProgressHeader from "@/components/onboarding/OnboardingProgressHeader";
import { useAppBack } from "@/hooks/useAppBack";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { EducationLevel } from "@/types/user";

const CORAL = "#FF6B6B";

const educationLevels: {
  description: string;
  icon: LucideIcon;
  label: string;
  value: EducationLevel;
}[] = [
  {
    description: "Currently in or finished",
    icon: School,
    label: "High School",
    value: "high_school",
  },
  {
    description: "Undergraduate studies",
    icon: GraduationCap,
    label: "Bachelor’s",
    value: "bachelors",
  },
  {
    description: "Graduate programs",
    icon: BookOpen,
    label: "Master’s",
    value: "masters",
  },
  {
    description: "Research & doctorate",
    icon: Award,
    label: "PhD / Doctoral",
    value: "phd",
  },
  {
    description: "English learning courses",
    icon: Globe2,
    label: "Language",
    value: "language",
  },
  {
    description: "Different educational path",
    icon: MoreHorizontal,
    label: "Other",
    value: "other",
  },
];

export default function Step3Education() {
  const router = useRouter();
  const handleBack = useAppBack("/onboarding/step2-home-country");
  const { user, setUser } = useUserStore();
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          if (isMounted) {
            InteractionManager.runAfterInteractions(() => {
              setTimeout(() => {
                router.replace("/onboarding/step1-account");
              }, 300);
            });
          }
          return;
        }

        if (isMounted) {
          if (user?.educationBackground?.level) {
            setSelectedLevel(user.educationBackground.level);
          }
          setIsReady(true);
        }
      } catch (initializationError) {
        console.error("Error initializing step3:", initializationError);
        if (isMounted) setIsReady(true);
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [router, user?.educationBackground?.level]);

  const navigateForward = () => {
    if (user?.destinationCountry) {
      router.replace("/onboarding/step5-visa");
    } else {
      router.replace("/onboarding/step4-destination");
    }
  };

  const handleContinue = async () => {
    if (!selectedLevel) {
      setError("Please select your education level");
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    setError("");

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error("Auth error in handleContinue:", authError);
        setError("Authentication error. Please try again.");
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            router.replace("/onboarding/step1-account");
          }, 300);
        });
        return;
      }

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
        return;
      }

      if (user) {
        setUser({
          ...user,
          educationBackground: {
            ...user.educationBackground,
            level: selectedLevel,
          },
          onboardingStep: user.destinationCountry ? 5 : 4,
        });
      }

      navigateForward();
    } catch (saveError) {
      console.error("Error saving education level:", saveError);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isReady) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <OnboardingProgressHeader onBack={handleBack} progress={0.25} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={CORAL} size="large" />
          <Text style={styles.loadingText}>Preparing your options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <OnboardingProgressHeader onBack={handleBack} progress={0.25} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Education</Text>
          <Text style={styles.title}>
            What’s your current education level?
          </Text>
        </View>

        {error ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View accessibilityRole="radiogroup" style={styles.optionsList}>
          {educationLevels.map((level) => {
            const Icon = level.icon;
            const selected = selectedLevel === level.value;

            return (
              <OnboardingChoiceCard
                description={level.description}
                disabled={isProcessing}
                icon={
                  <Icon
                    color={selected ? CORAL : "#6B7280"}
                    size={22}
                    strokeWidth={1.8}
                  />
                }
                key={level.value}
                layout="tile"
                onPress={() => {
                  setSelectedLevel(level.value);
                  setError("");
                }}
                selected={selected}
                testID={`education-level-${level.value}`}
                title={level.label}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          disabled={!selectedLevel}
          fullWidth
          loading={isProcessing}
          onPress={handleContinue}
          style={styles.continueButton}
          testID="education-continue"
          title="Continue"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FAFBFC",
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 14,
  },
  scrollContent: {
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 38,
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 24,
  },
  eyebrow: {
    color: CORAL,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  title: {
    color: "#1F2937",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 30,
    marginTop: 8,
    maxWidth: 330,
  },
  errorBanner: {
    backgroundColor: "#FFF1F2",
    borderRadius: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: "#BE123C",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  optionsList: {
    columnGap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  footer: {
    backgroundColor: "#FAFBFC",
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  continueButton: {
    borderRadius: 24,
    height: 56,
    shadowColor: CORAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
