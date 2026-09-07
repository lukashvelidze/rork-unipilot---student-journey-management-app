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
import {
  BriefcaseBusiness,
  GraduationCap,
  Languages,
  Plane,
  RefreshCw,
  Stamp,
  type LucideIcon,
} from "lucide-react-native";
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

const getVisaIcon = (visaType: VisaType): LucideIcon => {
  const searchableText = `${visaType.code} ${visaType.title}`.toLowerCase();

  if (/student|study|academic|f-?1/.test(searchableText)) {
    return GraduationCap;
  }
  if (/exchange|j-?1/.test(searchableText)) return RefreshCw;
  if (/language/.test(searchableText)) return Languages;
  if (/work|graduate|skilled/.test(searchableText)) return BriefcaseBusiness;
  if (/visitor|tourist|travel/.test(searchableText)) return Plane;

  return Stamp;
};

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
          <Text style={styles.eyebrow}>Visa</Text>
          <Text style={styles.title}>
            {isFromEditProfile
              ? "Update your visa type"
              : "What type of visa do you need?"}
          </Text>

          <View style={styles.countryContext}>
            <Text style={styles.countryFlag}>
              {effectiveCountry?.flag || "🌍"}
            </Text>
            <Text numberOfLines={1} style={styles.countryName}>
              For {effectiveCountry?.name || "your destination"}
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
              const VisaIcon = getVisaIcon(visaType);

              return (
                <OnboardingChoiceCard
                  description={visaType.description}
                  disabled={isProcessing}
                  icon={
                    <VisaIcon
                      color={selected ? CORAL : "#6B7280"}
                      size={22}
                      strokeWidth={1.8}
                    />
                  }
                  key={visaType.id}
                  layout="tile"
                  onPress={() => {
                    setSelectedVisaType(visaType);
                    setError("");
                  }}
                  selected={selected}
                  style={styles.visaCard}
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
    maxWidth: 340,
  },
  countryContext: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 10,
    maxWidth: 300,
  },
  countryFlag: {
    fontSize: 15,
  },
  countryName: {
    color: "#6B7280",
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 6,
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
    columnGap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 20,
  },
  visaCard: {
    minHeight: 148,
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
