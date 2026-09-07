import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import CountryBallPicker from "@/components/onboarding/CountryBallPicker";
import { useAppBack } from "@/hooks/useAppBack";
import { getCountries, supabase } from "@/lib/supabase";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { Country } from "@/types/user";

export default function Step4Destination() {
  const router = useRouter();
  const handleBack = useAppBack("/onboarding/step3-education");
  const { user, setUser } = useUserStore();
  const { setJourneyProgress } = useJourneyStore();

  const [destinationCountry, setDestinationCountry] = useState<Country | null>(null);
  const [destinationCountries, setDestinationCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const isProcessingRef = useRef(false);

  const fetchCountries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const { destination } = await getCountries();
      setDestinationCountries(destination);
    } catch (fetchError) {
      console.error("Error fetching destination countries:", fetchError);
      setError("Failed to load countries. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    if (!user?.destinationCountry || destinationCountries.length === 0) return;
    const matchingCountry = destinationCountries.find(
      (country) => country.code === user.destinationCountry?.code,
    );
    if (matchingCountry) setDestinationCountry(matchingCountry);
  }, [destinationCountries, user?.destinationCountry]);

  const handleSelect = async (country: Country) => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setDestinationCountry(country);
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

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          destination_country: country.code,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        setError("Failed to save your destination country. Please try again.");
        return;
      }

      if (user) {
        setUser({
          ...user,
          destinationCountry: country,
          journeyProgress: [],
          onboardingStep: 5,
        });
      }

      setJourneyProgress([]);
      router.push("/onboarding/step5-visa");
    } catch (saveError) {
      console.error("Error saving destination country:", saveError);
      setError("Something went wrong. Please try again.");
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <CountryBallPicker
      countries={destinationCountries}
      error={error}
      isLoading={isLoading}
      isProcessing={isProcessing}
      onBack={handleBack}
      onRetry={fetchCountries}
      onSelect={handleSelect}
      progress={0.8}
      selectedCountry={destinationCountry}
      subtitle="Select your destination country. We will customize your journey with country-specific requirements, visa processes and tasks."
      title="Where do you want to study?"
    />
  );
}
