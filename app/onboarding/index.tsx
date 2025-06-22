import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
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
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    homeCountry: "",
    destinationCountry: "",
  });
  
  // Check if user exists and has completed onboarding
  useEffect(() => {
    if (user && user.onboardingCompleted) {
      router.replace("/");
    } else if (user && !user.onboardingCompleted) {
      // Resume onboarding from last step
      setStep(user.onboardingStep);
      setName(user.name || "");
      setEmail(user.email || "");
      setHomeCountry(user.homeCountry.code ? user.homeCountry : null);
      setDestinationCountry(user.destinationCountry.code ? user.destinationCountry : null);
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
  
  const handleNext = () => {
    if (step === 0 || validateStep()) {
      const nextStep = step + 1;
      setStep(nextStep);
      
      // Save progress
      if (step === 1) {
        // Save name and email
        if (!user) {
          // Create new user
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
        updateOnboardingStep(nextStep);
        setUser({
          ...user!,
          homeCountry,
          onboardingStep: nextStep,
        });
      } else if (step === 3 && destinationCountry) {
        // Save destination country
        updateOnboardingStep(nextStep);
        setUser({
          ...user!,
          destinationCountry,
          onboardingStep: nextStep,
        });
      } else if (step === 4) {
        // Complete onboarding
        if (user) {
          setUser({
            ...user,
            onboardingCompleted: true,
          });
        }
        router.replace("/");
      }
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
              We've created your personalized journey from {homeCountry?.name} to {destinationCountry?.name}. Let's get started!
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
          fullWidth
          icon={<ChevronRight size={20} color={Colors.white} />}
          iconPosition="right"
        />
        
        {step > 0 && step < 4 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setStep(4)}
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