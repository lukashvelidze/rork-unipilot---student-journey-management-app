import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import Colors from "@/constants/colors";
import { SubscriptionTier } from "@/types/user";

export default function OnboardingIndex() {
  const router = useRouter();
  const { user, setUser } = useUserStore();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      // Check if user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        // Not authenticated, start from welcome
        router.replace("/onboarding/step0-welcome");
        return;
      }

      // Check if user has completed onboarding
      if (user?.onboardingCompleted) {
        router.replace("/(tabs)");
        return;
      }

      // Fetch user profile from Supabase
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // If profile doesn't exist, start from step 1
        router.replace("/onboarding/step1-account");
        return;
      }

      // Update local store with profile data
      if (profile) {
        // Determine onboarding step based on profile data
        // Onboarding is complete if visa_type is set (all required fields filled)
        let onboardingStep = 1;
        const isOnboardingComplete = !!profile.visa_type;
        
        if (isOnboardingComplete) {
          onboardingStep = 0; // Completed, will redirect to tabs
        } else if (profile.visa_type) {
          onboardingStep = 6; // Has visa, go to finish
        } else if (profile.destination_country) {
          onboardingStep = 5; // Has destination, go to visa
        } else if (profile.level_of_study) {
          onboardingStep = 4; // Has education level, go to destination
        } else if (profile.country_origin) {
          onboardingStep = 3; // Has home country, go to education
        } else if (profile.full_name && profile.email) {
          onboardingStep = 2; // Has account, go to home country
        }

        // Import types and fetch countries from Supabase
        const { EducationLevel } = require("@/types/user");
        const { getCountries } = require("@/lib/supabase");
        let originCountries: any[] = [];
        let destinationCountries: any[] = [];
        
        try {
          const countries = await getCountries();
          originCountries = countries.origin || [];
          destinationCountries = countries.destination || [];
        } catch (error) {
          console.error("Error fetching countries:", error);
        }
        
        // Find matching countries from fetched lists
        const homeCountry = profile.country_origin 
          ? (originCountries.find(c => c.code === profile.country_origin) || {
              code: profile.country_origin,
              name: profile.country_origin,
              flag: "",
            })
          : user?.homeCountry || { code: "", name: "", flag: "" };
          
        const destinationCountry = profile.destination_country
          ? (destinationCountries.find(c => c.code === profile.destination_country) || {
              code: profile.destination_country,
              name: profile.destination_country,
              flag: "",
            })
          : user?.destinationCountry || { code: "", name: "", flag: "" };
        
        const subscriptionTier = (profile.subscription_tier || user?.subscriptionTier || "free").toLowerCase() as SubscriptionTier;
        const premiumPlan = subscriptionTier === "premium" || subscriptionTier === "pro";

        const updatedUser = {
          ...user!,
          id: authUser.id,
          name: profile.full_name || user?.name || "",
          email: profile.email || authUser.email || "",
          homeCountry,
          destinationCountry,
          educationBackground: {
            level: (profile.level_of_study as EducationLevel) || user?.educationBackground?.level || "bachelors",
          },
          onboardingCompleted: isOnboardingComplete,
          onboardingStep,
          subscriptionTier,
          isPremium: premiumPlan,
        };

        setUser(updatedUser);

        // Redirect based on onboarding step
        if (isOnboardingComplete) {
          router.replace("/(tabs)");
        } else {
          router.replace(`/onboarding/step${onboardingStep}-${getStepName(onboardingStep)}`);
        }
      } else {
        // No profile found, start from step 1
        router.replace("/onboarding/step1-account");
      }
    } catch (error) {
      console.error("Error in onboarding check:", error);
      router.replace("/onboarding/step0-welcome");
    }
  };

  const getStepName = (step: number): string => {
    switch (step) {
      case 0:
        return "welcome";
      case 1:
        return "account";
      case 2:
        return "home-country";
      case 3:
        return "education";
      case 4:
        return "destination";
      case 5:
        return "visa";
      case 6:
        return "finish";
      default:
        return "account";
    }
  };

  // Show loading screen while checking
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Setting up your journey...</Text>
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
});
