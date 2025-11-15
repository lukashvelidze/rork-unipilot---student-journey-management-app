import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import CountrySelector from "@/components/CountrySelector";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import { supabase, getCountries } from "@/lib/supabase";
import { getJourneyProgressForCountry } from "@/mocks/journeyTasks";
import { Country } from "@/types/user";

export default function Step4Destination() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, updateOnboardingStep } = useUserStore();
  const { setJourneyProgress } = useJourneyStore();
  
  const [destinationCountry, setDestinationCountry] = useState<Country | null>(null);
  const [destinationCountries, setDestinationCountries] = useState<Country[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Fetch destination countries from Supabase
  useEffect(() => {
    async function fetchCountries() {
      try {
        setIsLoading(true);
        const { destination } = await getCountries();
        setDestinationCountries(destination);
        
        // Get popular destinations (first 8 or countries marked as popular)
        // For now, we'll use the first 8 as popular, but you can add a field to the database
        setPopularDestinations(destination.slice(0, 8));
      } catch (error: any) {
        console.error("Error fetching destination countries:", error);
        setError("Failed to load countries. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCountries();
  }, []);

  // Pre-fill if returning user
  useEffect(() => {
    if (user?.destinationCountry && destinationCountries.length > 0) {
      // Find matching country from fetched list
      const matched = destinationCountries.find(c => c.code === user.destinationCountry?.code);
      if (matched) {
        setDestinationCountry(matched);
      }
    }
  }, [user, destinationCountries]);

  const handleContinue = async () => {
    if (!destinationCountry) {
      setError("Please select your destination country");
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

      // Generate country-specific journey progress
      const customizedJourney = getJourneyProgressForCountry(destinationCountry.code);
      console.log("Generated customized journey for", destinationCountry.name, ":", customizedJourney.length, "stages");

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          destination_country: destinationCountry.code,
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
          destinationCountry,
          journeyProgress: customizedJourney,
          onboardingStep: 5,
        });
      }

      // Update journey store
      setJourneyProgress(customizedJourney);

      // Navigate to next step
      router.push("/onboarding/step5-visa");
    } catch (error: any) {
      console.error("Error saving destination country:", error);
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
          <View style={[styles.progressFill, { width: "67%" }]} />
        </View>
        <Text style={styles.progressText}>Step 4 of 6</Text>
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Where do you want to study?</Text>
          <Text style={styles.stepDescription}>
            Select your destination country. We'll customize your journey with country-specific requirements, visa processes, and tasks.
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading countries...</Text>
            </View>
          ) : (
            <>
              {/* Show popular destinations first */}
              {popularDestinations.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Popular Destinations</Text>
                  <View style={styles.popularDestinations}>
                    {popularDestinations.map((country) => (
                      <TouchableOpacity
                        key={country.code}
                        style={[
                          styles.popularDestinationCard,
                          destinationCountry?.code === country.code && styles.selectedDestination
                        ]}
                        onPress={() => {
                          setDestinationCountry(country);
                          setError("");
                        }}
                      >
                        <Text style={styles.countryFlag}>{country.flag}</Text>
                        <Text style={[
                          styles.countryName,
                          destinationCountry?.code === country.code && styles.selectedCountryName
                        ]}>
                          {country.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.orText}>or choose from all countries</Text>
                </>
              )}

              <CountrySelector
                label="Destination Country"
                value={destinationCountry}
                onChange={(country: Country) => {
                  setDestinationCountry(country);
                  setError("");
                }}
                countries={destinationCountries}
                error={error}
                placeholder="Search all countries..."
              />
            </>
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
          onPress={() => router.push("/onboarding/step5-visa")}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  popularDestinations: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  popularDestinationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedDestination: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  selectedCountryName: {
    color: Colors.primary,
    fontWeight: "600",
  },
  orText: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "center",
    marginBottom: 16,
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

