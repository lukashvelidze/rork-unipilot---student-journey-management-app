import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";

export default function Step1Account() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, updateOnboardingStep } = useUserStore();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Check if user is already authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  // Pre-fill if returning user
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // User is already authenticated, check if they need to continue onboarding
        router.replace("/onboarding");
      }
    } catch (error) {
      // Not authenticated, continue with sign up
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Name is only required for sign up
    if (isSignUp) {
      if (!name.trim()) {
        newErrors.name = "Name is required";
        isValid = false;
      } else {
        newErrors.name = "";
      }
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

    if (!password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (isSignUp && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    } else {
      newErrors.password = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert("Signup Error", error.message);
        setIsProcessing(false);
        return;
      }

      if (data.user) {
        // Use data.user.id directly from signUp response
        // The signUp response contains the user immediately, even if session isn't fully established
        // Calling getUser() might return null until session is confirmed
        const userId = data.user.id;
        
        if (!userId) {
          Alert.alert("Error", "Failed to get user ID after signup. Please try again.");
          setIsProcessing(false);
          return;
        }

        // Create user profile in Supabase
        // id MUST match auth.uid() (which is data.user.id from signUp response)
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([{
            id: userId, // Use userId from signUp response directly
            email: data.user.email || email, // Use email from signUp response
            full_name: name,
            // created_at has DEFAULT NOW() in schema
          }]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
          Alert.alert("Error", "Failed to create profile. Please try again.");
          setIsProcessing(false);
          return;
        }

        // Update local store
        setUser({
          ...user!,
          id: data.user.id,
          name,
          email,
          onboardingStep: 2,
        });

        // Navigate to next step
        router.push("/onboarding/step2-home-country");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrors({
        name: "",
        email: !email.trim() ? "Email is required" : "",
        password: !password.trim() ? "Password is required" : "",
      });
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Sign In Error", error.message);
        setIsProcessing(false);
        return;
      }

      if (data.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        // Update local store
        setUser({
          ...user!,
          id: data.user.id,
          name: profile?.full_name || data.user.email || "",
          email: profile?.email || data.user.email || "",
        });

        // Navigate to onboarding index to determine next step
        router.replace("/onboarding");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "17%" }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 6</Text>
        </View>

        {/* Main content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Let's get to know you</Text>
          <Text style={styles.stepDescription}>
            We'll use this information to personalize your experience
          </Text>

          {isSignUp && (
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />
          )}

          <Input
            label="Email Address"
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            showPasswordToggle
          />

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setErrors({ name: "", email: "", password: "" });
            }}
          >
            <Text style={styles.switchAuthText}>
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

        {/* Fixed footer with buttons */}
        <View style={styles.footer}>
          <Button
            title={isSignUp ? "Sign Up" : "Sign In"}
            onPress={isSignUp ? handleSignUp : handleSignIn}
            loading={isProcessing}
            fullWidth
            icon={<ChevronRight size={20} color={Colors.white} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  footer: {
    padding: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  switchAuth: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  switchAuthText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
});

