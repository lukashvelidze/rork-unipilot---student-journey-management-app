import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import CountryBallPicker from "@/components/onboarding/CountryBallPicker";
import { useAppBack } from "@/hooks/useAppBack";
import { getCountries, supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { Country } from "@/types/user";

export default function Step2HomeCountry() {
  const router = useRouter();
  const handleBack = useAppBack("/onboarding/step1-account");
  const { user, setUser } = useUserStore();

  const [homeCountry, setHomeCountry] = useState<Country | null>(null);
  const [originCountries, setOriginCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const isProcessingRef = useRef(false);

  const fetchCountries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const { origin } = await getCountries();
      setOriginCountries(origin);
    } catch (fetchError) {
      console.error("Error fetching origin countries:", fetchError);
      setError("Failed to load countries. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    if (!user?.homeCountry || originCountries.length === 0) return;
    const matchingCountry = originCountries.find(
      (country) => country.code === user.homeCountry?.code,
    );
    if (matchingCountry) setHomeCountry(matchingCountry);
  }, [originCountries, user?.homeCountry]);

  const handleSelect = async (country: Country) => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setHomeCountry(country);
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
          country_origin: country.code,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        setError("Failed to save your home country. Please try again.");
        return;
      }

      if (user) {
        setUser({
          ...user,
          homeCountry: country,
          onboardingStep: 3,
        });
      }

      router.push("/onboarding/step3-education");
    } catch (saveError) {
      console.error("Error saving home country:", saveError);
      setError("Something went wrong. Please try again.");
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <CountryBallPicker
      countries={originCountries}
      error={error}
      isLoading={isLoading}
      isProcessing={isProcessing}
      onBack={handleBack}
      onRetry={fetchCountries}
      onSelect={handleSelect}
      progress={0.4}
      selectedCountry={homeCountry}
      subtitle="Select your home country to customize your journey"
      title="Where are you from?"
    />
  );
}
