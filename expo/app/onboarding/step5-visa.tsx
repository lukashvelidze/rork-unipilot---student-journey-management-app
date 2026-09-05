import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, Stamp } from "lucide-react-native";
import Button from "@/components/Button";
import OnboardingChoiceCard from "@/components/onboarding/OnboardingChoiceCard";
import OnboardingProgressHeader from "@/components/onboarding/OnboardingProgressHeader";
import { useAppBack } from "@/hooks/useAppBack";
import { supabase } from "@/lib/supabase";
import { posthog } from "@/src/config/posthog";
import { useUserStore } from "@/store/userStore";
import { Country } from "@/types/user";

const CORAL = "#FF6B6B";

interface VisaType {
  code: string;
  country_code: string | null;
  description: string | null;
  id: string;
  is_active: boolean;
  title: string;
}

const normalizeParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default function Step5Visa() {
  const router = useRouter();
  const handleBack = useAppBack("/(tabs)");
  const params = useLocalSearchParams<{
    pendingBio?: string;
    pendingCareerGoal?: string;
    pendingCountryCode?: string;
    pendingCountryFlag?: string;
    pendingCountryName?: string;
    pendingEducationLevel?: string;
    pendingEmail?: string;
    pendingHomeCountryCode?: string;
    pendingHomeCountryFlag?: string;
    pendingHomeCountryName?: string;
    pendingName?: string;
    fromEditProfile?: string;
  }>();
  const {
    completeOnboarding,
    setUser,
    updateDestinationCountry,
    updateUser,
    user,
  } = useUserStore();

  const pendingDestinationCountry = useMemo<Country | null>(() => {
    const code = normalizeParam(params.pendingCountryCode);
    if (!code) return null;

    return {
      code,
      flag: normalizeParam(params.pendingCountryFlag) || "",
      name: normalizeParam(params.pendingCountryName) || code,
    };
  }, [
    params.pendingCountryCode,
    params.pendingCountryFlag,
    params.pendingCountryName,
  ]);

  const pendingHomeCountry = useMemo<Country | null>(() => {
    const code = normalizeParam(params.pendingHomeCountryCode);
    if (!code) return null;

    return {
      code,
      flag: normalizeParam(params.pendingHomeCountryFlag) || "",
      name: normalizeParam(params.pendingHomeCountryName) || code,
    };
  }, [
    params.pendingHomeCountryCode,
    params.pendingHomeCountryFlag,
    params.pendingHomeCountryName,
  ]);

  const isFromEditProfile = params.fromEditProfile === "true";
  const effectiveCountry = pendingDestinationCountry || user?.destinationCountry;
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [selectedVisaType, setSelectedVisaType] = useState<VisaType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const loadVisaTypes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return;

      let countryCode = effectiveCountry?.code;

      if (!countryCode) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("destination_country")
          .eq("id", authUser.id)
          .single();

        if (profileError || !profile?.destination_country) {
          console.error("No destination country found", profileError);
          setError("Please set your destination country first.");
          return;
        }

        countryCode = profile.destination_country;
      }

      if (!countryCode) {
        setError("Please set your destination country first.");
        return;
      }

      const sanitizedCode = countryCode.trim().toUpperCase();
      const { data, error: queryError } = await supabase
        .from("visa_types")
        .select("*")
        .or(`country_code.eq.${sanitizedCode},country_code.is.null`)
        .eq("is_active", true)
        .order("country_code", { ascending: false })
        .order("title", { ascending: true });

      if (queryError) {
        console.error("Error loading visa types:", queryError);
        setError("Failed to load visa types. Please try again.");
        return;
      }

      setVisaTypes(data || []);
      setSelectedVisaType(null);
    } catch (loadError) {
      console.error("Error loading visa types:", loadError);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCountry?.code]);

  useEffect(() => {
    loadVisaTypes();
  }, [loadVisaTypes]);

  const handleContinue = async () => {
    if (!selectedVisaType) {
      setError("Please select a visa type");
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    setError("");

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.replace("/onboarding/step1-account");
        return;
      }

      const updateData: Record<string, string> = {
        updated_at: new Date().toISOString(),
        visa_type: selectedVisaType.code,
      };

      if (isFromEditProfile) {
        if (pendingDestinationCountry) {
          updateData.destination_country =
            pendingDestinationCountry.code.toUpperCase();
        }
        if (pendingHomeCountry) {
          updateData.country_origin = pendingHomeCountry.code.toUpperCase();
        }
        if (params.pendingName) updateData.full_name = params.pendingName;
        if (params.pendingEmail) updateData.email = params.pendingEmail;
        if (params.pendingEducationLevel) {
          updateData.level_of_study = params.pendingEducationLevel;
        }
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        setError("Failed to save. Please try again.");
        return;
      }

      if (user) {
        if (isFromEditProfile) {
          const updatedUserData: Record<string, unknown> = {
            destinationCountry:
              pendingDestinationCountry || user.destinationCountry,
          };

          if (pendingHomeCountry) {
            updatedUserData.homeCountry = pendingHomeCountry;
          }
          if (params.pendingName) updatedUserData.name = params.pendingName;
          if (params.pendingEmail) updatedUserData.email = params.pendingEmail;
          if (params.pendingEducationLevel) {
            updatedUserData.educationBackground = {
              ...user.educationBackground,
              level: params.pendingEducationLevel,
            };
          }
          if (params.pendingCareerGoal) {
            updatedUserData.careerGoal = params.pendingCareerGoal;
          }
          if (params.pendingBio) updatedUserData.bio = params.pendingBio;

          updateUser(updatedUserData);
          updateDestinationCountry(
            pendingDestinationCountry || user.destinationCountry!,
          );
        } else {
          setUser({
            ...user,
            onboardingCompleted: true,
            onboardingStep: 0,
          });
          completeOnboarding();

          posthog.capture("onboarding_completed", {
            destination_country: user.destinationCountry?.name,
            education_level: user.educationBackground?.level,
            home_country: user.homeCountry?.name,
          });
        }
      }

      const { useJourneyStore } = require("@/store/journeyStore");
      const journeyStore = useJourneyStore.getState();
      journeyStore.setJourneyProgress([]);

      try {
        await Promise.race([
          journeyStore.refreshJourney(),
          new Promise((resolve) => setTimeout(resolve, 6000)),
        ]);
      } catch (refreshError) {
        console.warn("Journey refresh failed:", refreshError);
      }

      if (isFromEditProfile) {
        Alert.alert(
          "Journey Updated",
          "Your journey modules were refreshed for the new country. Would you like to view them now?",
          [
            {
              onPress: () => router.replace("/(tabs)/profile"),
              style: "cancel",
              text: "Not now",
            },
            {
              onPress: () => router.replace("/(tabs)/journey"),
              text: "Go to journey",
            },
          ],
        );
        return;
      }

      router.replace(user?.onboardingCompleted ? "/(tabs)/journey" : "/(tabs)");
    } catch (saveError) {
      console.error("Error saving visa type:", saveError);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <OnboardingProgressHeader onBack={handleBack} progress={1} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={CORAL} size="large" />
          <Text style={styles.loadingText}>Finding your visa options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <OnboardingProgressHeader onBack={handleBack} progress={1} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.heroIcon}>
            <Stamp color={CORAL} size={27} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>
            {isFromEditProfile
              ? "Update your visa type"
              : "What type of visa do you need?"}
          </Text>
          <Text style={styles.subtitle}>
            {isFromEditProfile
              ? `Choose the visa type for your updated destination.`
              : "Choose the option that best matches your study plans."}
          </Text>

          <View style={styles.countryPill}>
            <Text style={styles.countryFlag}>
              {effectiveCountry?.flag || "🌍"}
            </Text>
            <Text numberOfLines={1} style={styles.countryName}>
              {effectiveCountry?.name || "Your destination"}
            </Text>
          </View>
        </View>

        {error ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {visaTypes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Stamp color="#94A3B8" size={26} strokeWidth={1.7} />
            </View>
            <Text style={styles.emptyTitle}>No visa types found</Text>
            <Text style={styles.emptyText}>
              Please try again shortly or go back and choose another
              destination.
            </Text>
            <TouchableOpacity onPress={loadVisaTypes} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View accessibilityRole="radiogroup" style={styles.visaTypesList}>
            {visaTypes.map((visaType) => {
              const selected = selectedVisaType?.id === visaType.id;

              return (
                <OnboardingChoiceCard
                  description={visaType.description}
                  disabled={isProcessing}
                  icon={
                    <Stamp
                      color={selected ? CORAL : "#64748B"}
                      size={22}
                      strokeWidth={1.8}
                    />
                  }
                  key={visaType.id}
                  onPress={() => {
                    setSelectedVisaType(visaType);
                    setError("");
                  }}
                  selected={selected}
                  testID={`visa-type-${visaType.code}`}
                  title={visaType.title}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          disabled={!selectedVisaType}
          fullWidth
          icon={<ChevronRight color="#FFFFFF" size={20} />}
          loading={isProcessing}
          onPress={handleContinue}
          style={styles.continueButton}
          testID="visa-continue"
          title={isFromEditProfile ? "Save changes" : "Finish setup"}
        />

        {isFromEditProfile || user?.onboardingCompleted ? (
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isProcessing}
            onPress={handleBack}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
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
    paddingBottom: 22,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 26,
    paddingTop: 32,
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
    maxWidth: 350,
    textAlign: "center",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 330,
    textAlign: "center",
  },
  countryPill: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 16,
    maxWidth: 250,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryName: {
    color: "#334155",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 7,
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
  visaTypesList: {
    gap: 10,
  },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#E5E7EB",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: CORAL,
    borderRadius: 18,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
});
