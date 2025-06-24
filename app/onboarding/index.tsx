import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import Input from "@/components/Input";
import CountrySelector from "@/components/CountrySelector";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import { countries, getPopularDestinations } from "@/mocks/countries";
import { getJourneyProgressForCountry } from "@/mocks/journeyTasks";
import { generateId } from "@/utils/helpers";
import { Country, UserProfile } from "@/types/user";

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setUser, updateOnboardingStep, completeOnboarding } = useUserStore();
  const { setJourneyProgress } = useJourneyStore();
  
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [homeCountry, setHomeCountry] = useState<Country | null>(null);
  const [destinationCountry, setDestinationCountry] = useState<Country | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    homeCountry: "",
    destinationCountry: "",
  });
  
  // Check if user exists and has completed onboarding
  useEffect(() => {
    console.log("Onboarding screen mounted, user:", user);
    if (user && user.onboardingCompleted) {
      console.log("User has completed onboarding, redirecting to home");
      router.replace("/(tabs)");
    } else if (user && !user.onboardingCompleted) {
      // Resume onboarding from last step
      console.log("Resuming onboarding from step:", user.onboardingStep);
      setStep(user.onboardingStep);
      setName(user.name || "");
      setEmail(user.email || "");
      if (user.homeCountry && user.homeCountry.code) {
        setHomeCountry(user.homeCountry);
      }
      if (user.destinationCountry && user.destinationCountry.code) {
        setDestinationCountry(user.destinationCountry);
      }
    }
  }, [user, router]);
  
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const validateStep = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    switch (step) {
      case 1:
        if (!name.trim()) {
          newErrors.name = "Name is required";
          isValid = false;
        } else {
          newErrors.name = "";
        }
        
        if (!email.trim()) {
          newErrors.email = "Email is required";
          isValid = false;
        } else if (!validateEmail(email)) {
          newErrors.email = "Please enter a valid email";
          isValid = false;
        } else {
          newErrors.email = "";
        }
        break;
      
      case 2:
        if (!homeCountry) {
          newErrors.homeCountry = "Please select your home country";
          isValid = false;
        } else {
          newErrors.homeCountry = "";
        }
        break;
      
      case 3:
        if (!destinationCountry) {
          newErrors.destinationCountry = "Please select your destination country";
          isValid = false;
        } else {
          newErrors.destinationCountry = "";
        }
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Save user data based on current step
  const saveUserData = async (nextStep: number) => {
    try {
      console.log("Saving user data for step:", step, "next step:", nextStep);
      
      if (step === 0) {
        // Just update the step
        if (user) {
          updateOnboardingStep(nextStep);
        }
      } else if (step === 1) {
        // Save name and email
        if (!user) {
          // Create new user
          console.log("Creating new user with name:", name, "email:", email);
          const newUser: UserProfile = {
            id: generateId(),
            name,
            email,
            bio: "",
            careerGoal: "",
            homeCountry: { code: "", name: "", flag: "" },
            destinationCountry: { code: "", name: "", flag: "" },
            educationBackground: { level: "bachelors" },
            testScores: [],
            universities: [],
            documents: [],
            journeyProgress: [],
            memories: [],
            onboardingCompleted: false,
            onboardingStep: nextStep,
            isPremium: false,
          };
          setUser(newUser);
        } else {
          // Update existing user
          console.log("Updating existing user with name:", name, "email:", email);
          updateOnboardingStep(nextStep);
          setUser({
            ...user,
            name,
            email,
            onboardingStep: nextStep,
          });
        }
      } else if (step === 2 && homeCountry) {
        // Save home country
        console.log("Saving home country:", homeCountry);
        if (user) {
          updateOnboardingStep(nextStep);
          setUser({
            ...user,
            homeCountry,
            onboardingStep: nextStep,
          });
        }
      } else if (step === 3 && destinationCountry) {
        // Save destination country and generate customized journey
        console.log("Saving destination country:", destinationCountry);
        if (user) {
          // Generate country-specific journey progress
          const customizedJourney = getJourneyProgressForCountry(destinationCountry.code);
          console.log("Generated customized journey for", destinationCountry.name, ":", customizedJourney.length, "stages");
          
          updateOnboardingStep(nextStep);
          setUser({
            ...user,
            destinationCountry,
            journeyProgress: customizedJourney,
            onboardingStep: nextStep,
          });
          
          // Also update the journey store
          setJourneyProgress(customizedJourney);
        }
      } else if (step === 4) {
        // Complete onboarding
        console.log("Completing onboarding");
        if (user) {
          setUser({
            ...user,
            onboardingCompleted: true,
          });
        }
        
        // Navigate to home screen
        console.log("Navigating to home screen");
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Error saving user data:", error);
      Alert.alert("Error", "There was a problem saving your information. Please try again.");
    }
  };
  
  const handleNext = async () => {
    console.log("Continue button pressed, current step:", step);

    if (isProcessing) {
      console.log("Already processing, ignoring click");
      return;
    }

    setIsProcessing(true);

    try {
      // If it's the welcome step or validation passes
      if (step === 0 || validateStep()) {
        const nextStep = step + 1;
        console.log("Moving to next step:", nextStep);

        setStep(nextStep);
        await saveUserData(nextStep);
      } else {
        console.log("Validation failed for step:", step);
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.welcomeContainer}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
              style={styles.welcomeImage}
              resizeMode="cover"
            />
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Welcome to UniPilot</Text>
              <Text style={styles.welcomeText}>
                Your personal guide through the entire international student journey, from university applications to career establishment worldwide.
              </Text>
            </View>
          </View>
        );
      
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Let's get to know you</Text>
            <Text style={styles.stepDescription}>
              We'll use this information to personalize your experience
            </Text>
            
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />
            
            <Input
              label="Email Address"
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Where are you from?</Text>
            <Text style={styles.stepDescription}>
              Select your home country to customize your journey
            </Text>
            
            <CountrySelector
              label="Home Country"
              value={homeCountry}
              onChange={(country: Country) => setHomeCountry(country)}
              countries={countries}
              error={errors.homeCountry}
            />
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Where do you want to study?</Text>
            <Text style={styles.stepDescription}>
              Select your destination country. We'll customize your journey with country-specific requirements, visa processes, and tasks.
            </Text>
            
            {/* Show popular destinations first */}
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <View style={styles.popularDestinations}>
              {getPopularDestinations().map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.popularDestinationCard,
                    destinationCountry?.code === country.code && styles.selectedDestination
                  ]}
                  onPress={() => setDestinationCountry(country)}
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
            
            <CountrySelector
              label="Destination Country"
              value={destinationCountry}
              onChange={(country: Country) => setDestinationCountry(country)}
              countries={countries}
              error={errors.destinationCountry}
              placeholder="Search all countries..."
            />
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
              style={styles.welcomeImage}
              resizeMode="cover"
            />
            <Text style={styles.stepTitle}>You're all set!</Text>
            <Text style={styles.stepDescription}>
              We've created your personalized journey from {homeCountry?.name || "your country"} to {destinationCountry?.name || "your destination"}. 
              {"\n\n"}
              Your journey includes country-specific visa requirements, document checklists, and step-by-step guidance tailored for {destinationCountry?.name || "your destination"}.
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Progress bar - only show for steps 1-4 */}
      {step > 0 && step < 4 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(step / 4) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>Step {step} of 4</Text>
        </View>
      )}
      
      {/* Main content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
      
      {/* Fixed footer with buttons */}
      <View style={styles.footer}>
        <Button
          title={step === 4 ? "Get Started" : "Continue"}
          onPress={handleNext}
          loading={isProcessing}
          fullWidth
          icon={<ChevronRight size={20} color={Colors.white} />}
          iconPosition="right"
        />
        
        {/* Skip button - only show for steps 1-3 */}
        {step > 0 && step < 4 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={async () => {
              if (isProcessing) return;
              setIsProcessing(true);
              console.log("Skip button pressed, moving to final step");
              setStep(4);
              // Update the onboarding step in the store
              if (user) {
                updateOnboardingStep(4);
                await saveUserData(4);
              }
              setIsProcessing(false);
            }}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  welcomeImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 32,
  },
  welcomeContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
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
    zIndex: 1000,
    elevation: 1000,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
    zIndex: 1001,
    elevation: 1001,
  },
  skipText: {
    fontSize: 14,
    color: Colors.lightText,
  },
});