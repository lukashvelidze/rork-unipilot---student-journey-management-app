import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";

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
  const { user, setUser, updateOnboardingStep } = useUserStore();
  
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [selectedVisaType, setSelectedVisaType] = useState<VisaType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVisaTypes();
  }, []);

  const loadVisaTypes = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser || !user?.destinationCountry) {
        setIsLoading(false);
        return;
      }

      // Query visa types for the destination country
      const { data, error: queryError } = await supabase
        .from("visa_types")
        .select("*")
        .eq("country_code", user.destinationCountry.code)
        .eq("is_active", true)
        .order("title");

      if (queryError) {
        console.error("Error loading visa types:", queryError);
        setError("Failed to load visa types. Please try again.");
      } else {
        setVisaTypes(data || []);
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
        router.replace("/onboarding/step1-account");
        return;
      }

      // Update profile in Supabase
      // Note: visa_type stores the visa code (TEXT), not the UUID
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          visa_type: selectedVisaType.code,
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
          onboardingStep: 6,
        });
      }

      // Navigate to next step
      router.push("/onboarding/step6-finish");
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
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "83%" }]} />
        </View>
        <Text style={styles.progressText}>Step 5 of 6</Text>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>What type of visa do you need?</Text>
          <Text style={styles.stepDescription}>
            Select the visa type that matches your study plans for {user?.destinationCountry?.name || "your destination"}
          </Text>

          {error && !selectedVisaType && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {visaTypes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No visa types found for {user?.destinationCountry?.name || "this country"}.
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
          onPress={() => router.push("/onboarding/step6-finish")}
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

