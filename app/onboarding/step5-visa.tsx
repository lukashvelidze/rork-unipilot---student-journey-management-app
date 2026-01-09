import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import { Country } from "@/types/user";

interface VisaType {
  id: string;
  country_code: string;
  code: string;
  title: string;
  description: string | null;
  is_active: boolean;
}

export default function Step5Visa() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    pendingCountryCode?: string;
    pendingCountryName?: string;
    pendingCountryFlag?: string;
    pendingHomeCountryCode?: string;
    pendingHomeCountryName?: string;
    pendingHomeCountryFlag?: string;
    pendingName?: string;
    pendingEmail?: string;
    pendingEducationLevel?: string;
    pendingCareerGoal?: string;
    pendingBio?: string;
    fromEditProfile?: string;
  }>();
  const { user, setUser, updateDestinationCountry, updateUser } = useUserStore();

  // Check if we have a pending country change from edit profile
  const normalizeParam = (value?: string | string[]) => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const pendingDestinationCountry: Country | null = normalizeParam(params.pendingCountryCode) ? {
    code: normalizeParam(params.pendingCountryCode)!,
    name: normalizeParam(params.pendingCountryName) || normalizeParam(params.pendingCountryCode)!,
    flag: normalizeParam(params.pendingCountryFlag) || "",
  } : null;

  const pendingHomeCountry: Country | null = normalizeParam(params.pendingHomeCountryCode) ? {
    code: normalizeParam(params.pendingHomeCountryCode)!,
    name: normalizeParam(params.pendingHomeCountryName) || normalizeParam(params.pendingHomeCountryCode)!,
    flag: normalizeParam(params.pendingHomeCountryFlag) || "",
  } : null;

  const isFromEditProfile = params.fromEditProfile === "true";

  // Use pending country if available, otherwise use user's current destination
  const effectiveCountry = pendingDestinationCountry || user?.destinationCountry;

  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [selectedVisaType, setSelectedVisaType] = useState<VisaType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVisaTypes();
  }, [effectiveCountry?.code]); // Reload when effective country changes

  const loadVisaTypes = async () => {
    try {
      setIsLoading(true);
      setError("");
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setIsLoading(false);
        return;
      }

      // Get destination country - prefer pending country, then user store, then fetch from profile
      let countryCode = effectiveCountry?.code;

      if (!countryCode) {
        // Fetch from profile if not in store
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("destination_country")
          .eq("id", authUser.id)
          .single();

        if (profileError || !profile?.destination_country) {
          console.error("No destination country found");
          setError("Please set your destination country first.");
          setIsLoading(false);
          return;
        }

        countryCode = profile.destination_country;
      }

      if (!countryCode) {
        setError("Please set your destination country first.");
        setIsLoading(false);
        return;
      }

      const sanitizedCode = countryCode.trim().toUpperCase();
      // Query visa types for the destination country or generic ones
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
      } else {
        setVisaTypes(data || []);
        setError("");
      }
    } catch (error: any) {
      console.error("Error loading visa types:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedVisaType) {
      setError("Please select a visa type");
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
        setIsProcessing(false);
        router.replace("/onboarding/step1-account");
        return;
      }

      // Build the update object
      const updateData: any = {
        visa_type: selectedVisaType.code,
        updated_at: new Date().toISOString(),
      };

      // If coming from edit profile, include all profile updates
      if (isFromEditProfile) {
        if (pendingDestinationCountry) {
          updateData.destination_country = pendingDestinationCountry.code.toUpperCase();
        }
        if (pendingHomeCountry) {
          updateData.country_origin = pendingHomeCountry.code.toUpperCase();
        }
        if (params.pendingName) {
          updateData.full_name = params.pendingName;
        }
        if (params.pendingEmail) {
          updateData.email = params.pendingEmail;
        }
        if (params.pendingEducationLevel) {
          updateData.level_of_study = params.pendingEducationLevel;
        }
      }

      // Update profile in Supabase (all data together)
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        setError("Failed to save. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Update local store
      if (user) {
        if (isFromEditProfile) {
          // Update all profile data in store
          const updatedUserData: any = {
            destinationCountry: pendingDestinationCountry || user.destinationCountry,
          };

          if (pendingHomeCountry) {
            updatedUserData.homeCountry = pendingHomeCountry;
          }
          if (params.pendingName) {
            updatedUserData.name = params.pendingName;
          }
          if (params.pendingEmail) {
            updatedUserData.email = params.pendingEmail;
          }
          if (params.pendingEducationLevel) {
            updatedUserData.educationBackground = {
              ...user.educationBackground,
              level: params.pendingEducationLevel,
            };
          }
          if (params.pendingCareerGoal) {
            updatedUserData.careerGoal = params.pendingCareerGoal;
          }
          if (params.pendingBio) {
            updatedUserData.bio = params.pendingBio;
          }

          updateUser(updatedUserData);
          updateDestinationCountry(pendingDestinationCountry || user.destinationCountry!);
        } else {
          setUser({
            ...user,
            onboardingStep: 6,
          });
        }
      }

      // Refresh journey store to fetch new checklists
      const { useJourneyStore } = require("@/store/journeyStore");
      const journeyStore = useJourneyStore.getState();

      // Clear old journey data and refresh
      journeyStore.setJourneyProgress([]);
      await journeyStore.refreshJourney();

      // Navigate based on where user came from
      if (isFromEditProfile) {
        Alert.alert(
          "Journey Updated",
          "Your journey modules were refreshed for the new country. Would you like to view them now?",
          [
            {
              text: "Not now",
              style: "cancel",
              onPress: () => router.replace("/(tabs)/profile"),
            },
            {
              text: "Go to journey",
              onPress: () => router.replace("/(tabs)/journey"),
            },
          ]
        );
        return;
      }

      if (user?.onboardingCompleted) {
        router.replace("/(tabs)/journey");
      } else {
        // Normal onboarding flow - go to finish step
        router.push("/onboarding/step6-finish");
      }
    } catch (error: any) {
      console.error("Error saving visa type:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading visa types...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Progress bar - only show during onboarding */}
      {!isFromEditProfile && !user?.onboardingCompleted && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "83%" }]} />
          </View>
          <Text style={styles.progressText}>Step 5 of 6</Text>
        </View>
      )}

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>
            {isFromEditProfile ? "Update Your Visa Type" : "What type of visa do you need?"}
          </Text>
          <Text style={styles.stepDescription}>
            {isFromEditProfile
              ? `You changed your destination to ${effectiveCountry?.name || "a new country"}. Please select the visa type for this country.`
              : `Select the visa type that matches your study plans for ${effectiveCountry?.name || "your destination"}`
            }
          </Text>

          {error && !selectedVisaType && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {visaTypes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No visa types found for {effectiveCountry?.name || "this country"}.
              </Text>
              <Text style={styles.emptySubtext}>
                You can continue and update this later.
              </Text>
            </View>
          ) : (
            <View style={styles.visaTypesList}>
              {visaTypes.map((visaType) => (
                <TouchableOpacity
                  key={visaType.id}
                  style={[
                    styles.visaTypeCard,
                    selectedVisaType?.id === visaType.id && styles.selectedVisaType
                  ]}
                  onPress={() => {
                    setSelectedVisaType(visaType);
                    setError("");
                  }}
                >
                  <View style={styles.visaTypeContent}>
                    <Text style={[
                      styles.visaTypeTitle,
                      selectedVisaType?.id === visaType.id && styles.selectedVisaTypeTitle
                    ]}>
                      {visaType.title}
                    </Text>
                    {visaType.description && (
                      <Text style={[
                        styles.visaTypeDescription,
                        selectedVisaType?.id === visaType.id && styles.selectedVisaTypeDescription
                      ]}>
                        {visaType.description}
                      </Text>
                    )}
                  </View>
                  {selectedVisaType?.id === visaType.id && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
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
          onPress={() => {
            if (isFromEditProfile) {
              // Go back to edit profile without saving
              router.back();
            } else if (user?.onboardingCompleted) {
              // Go back to previous screen
              router.back();
            } else {
              router.push("/onboarding/step6-finish");
            }
          }}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>{isFromEditProfile ? "Cancel" : "Skip for now"}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.lightText,
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
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.lightText,
    marginBottom: 32,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
  },
  visaTypesList: {
    gap: 12,
  },
  visaTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedVisaType: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary,
  },
  visaTypeContent: {
    flex: 1,
  },
  visaTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  selectedVisaTypeTitle: {
    color: Colors.primary,
  },
  visaTypeDescription: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
  },
  selectedVisaTypeDescription: {
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
