import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  BookOpen,
  ChevronRight,
  FlaskConical,
  GraduationCap,
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
    description: "Currently in or completed high school",
    icon: School,
    label: "High School",
    value: "high_school",
  },
  {
    description: "Pursuing or completed undergraduate studies",
    icon: BookOpen,
    label: "Bachelor’s Degree",
    value: "bachelors",
  },
  {
    description: "Pursuing or completed graduate studies",
    icon: GraduationCap,
    label: "Master’s Degree",
    value: "masters",
  },
  {
    description: "Pursuing or completed doctoral studies",
    icon: FlaskConical,
    label: "PhD",
    value: "phd",
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
        <OnboardingProgressHeader onBack={handleBack} progress={0.6} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={CORAL} size="large" />
          <Text style={styles.loadingText}>Preparing your options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <OnboardingProgressHeader onBack={handleBack} progress={0.6} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.heroIcon}>
            <GraduationCap color={CORAL} size={28} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>What’s your education level?</Text>
          <Text style={styles.subtitle}>
            This helps us personalize your journey and show the most relevant
            guidance.
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
                    color={selected ? CORAL : "#64748B"}
                    size={23}
                    strokeWidth={1.8}
                  />
                }
                key={level.value}
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
          icon={<ChevronRight color="#FFFFFF" size={20} />}
          loading={isProcessing}
          onPress={handleContinue}
          style={styles.continueButton}
          testID="education-continue"
          title="Continue"
        />
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isProcessing}
          onPress={navigateForward}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
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
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 26,
    paddingTop: 34,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    borderRadius: 22,
    height: 54,
    justifyContent: "center",
    marginBottom: 18,
    width: 54,
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.55,
    textAlign: "center",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 340,
    textAlign: "center",
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
    gap: 10,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#F1F5F9",
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  continueButton: {
    borderRadius: 28,
    height: 56,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
});
