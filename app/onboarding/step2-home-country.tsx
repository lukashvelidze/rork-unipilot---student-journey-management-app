import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import CountrySelector from "@/components/CountrySelector";
import { useUserStore } from "@/store/userStore";
import { supabase, getCountries } from "@/lib/supabase";
import { Country } from "@/types/user";

export default function Step2HomeCountry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, updateOnboardingStep } = useUserStore();
  
  const [homeCountry, setHomeCountry] = useState<Country | null>(null);
  const [originCountries, setOriginCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Fetch origin countries from Supabase
  useEffect(() => {
    async function fetchCountries() {
      try {
        setIsLoading(true);
        const { origin } = await getCountries();
        setOriginCountries(origin);
      } catch (error: any) {
        console.error("Error fetching origin countries:", error);
        setError("Failed to load countries. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCountries();
  }, []);

  // Pre-fill if returning user
  useEffect(() => {
    if (user?.homeCountry && originCountries.length > 0) {
      // Find matching country from fetched list
      const matched = originCountries.find(c => c.code === user.homeCountry?.code);
      if (matched) {
        setHomeCountry(matched);
      }
    }
  }, [user, originCountries]);

  const handleContinue = async () => {
    if (!homeCountry) {
      setError("Please select your home country");
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
          country_origin: homeCountry.code,
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
          homeCountry,
          onboardingStep: 3,
        });
      }

      // Navigate to next step
      router.push("/onboarding/step3-education");
    } catch (error: any) {
      console.error("Error saving home country:", error);
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
          <View style={[styles.progressFill, { width: "33%" }]} />
        </View>
        <Text style={styles.progressText}>Step 2 of 6</Text>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Where are you from?</Text>
          <Text style={styles.stepDescription}>
            Select your home country to customize your journey
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading countries...</Text>
            </View>
          ) : (
            <CountrySelector
              label="Home Country"
              value={homeCountry}
              onChange={(country: Country) => {
                setHomeCountry(country);
                setError("");
              }}
              countries={originCountries}
              error={error}
            />
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
          onPress={() => router.push("/onboarding/step3-education")}
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
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.lightText,
  },
});

