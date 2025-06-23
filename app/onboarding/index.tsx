import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import Input from "@/components/Input";
import CountrySelector from "@/components/CountrySelector";
import { useUserStore } from "@/store/userStore";
import { countries } from "@/mocks/countries";
import { generateId } from "@/utils/helpers";
import { Country, UserProfile } from "@/types/user";

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setUser, updateOnboardingStep } = useUserStore();
  
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
  const saveUserData = (nextStep: number) => {
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
        // Save destination country
        console.log("Saving destination country:", destinationCountry);
        if (user) {
          updateOnboardingStep(nextStep);
          setUser({
            ...user,
            destinationCountry,
            onboardingStep: nextStep,
          });
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
  
  const handleNext = () => {
    console.log("Continue button pressed, current step:", step);
    
    // Prevent multiple clicks
    if (isProcessing) {
      console.log("Already processing, ignoring click");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // For step 0 (welcome) or if validation passes
      if (step === 0 || validateStep()) {
        const nextStep = step + 1;
        console.log("Moving to next step:", nextStep);
        
        // First update the step state
        setStep(nextStep);
        
        // Then save user data
        saveUserData(nextStep);
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
          <View style={styles.stepContainer}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
              style={styles.welcomeImage}
              resizeMode="cover"
            />
            <Text style={styles.welcomeTitle}>Welcome to UniPilot</Text>
            <Text style={styles.welcomeText}>
              Your personal guide through the entire international student journey, from university applications to career establishment.
            </Text>
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
              Select your home country
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
            <Text style={styles.stepTitle}>Where are you going?</Text>
            <Text style={styles.stepDescription}>
              Select your destination country for studies
            </Text>
            
            <CountrySelector
              label="Destination Country"
              value={destinationCountry}
              onChange={(country: Country) => setDestinationCountry(country)}
              countries={countries}
              error={errors.destinationCountry}
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
              We've created your personalized journey from {homeCountry?.name || "your country"} to {destinationCountry?.name || "your destination"}. Let's get started!
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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
        
        {renderStep()}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title={step === 4 ? "Get Started" : "Continue"}
          onPress={handleNext}
          loading={isProcessing}
          fullWidth
          icon={<ChevronRight size={20} color={Colors.white} />}
          iconPosition="right"
        />
        
        {step > 0 && step < 4 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              if (isProcessing) return;
              setIsProcessing(true);
              console.log("Skip button pressed, moving to final step");
              setStep(4);
              // Update the onboarding step in the store
              if (user) {
                updateOnboardingStep(4);
                saveUserData(4);
              }
              setIsProcessing(false);
            }}
            disabled={isProcessing}
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  progressContainer: {
    marginBottom: 24,
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
  stepContainer: {
    flex: 1,
    justifyContent: "center",
  },
  welcomeImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
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
    marginBottom: 24,
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    color: Colors.lightText,
  },
});