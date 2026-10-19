import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Button from "@/components/Button";
import Input from "@/components/Input";
import OnboardingProgressHeader from "@/components/onboarding/OnboardingProgressHeader";
import { useAppBack } from "@/hooks/useAppBack";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import { posthog } from "@/src/config/posthog";

const worldMap = require("@/assets/images/onboarding/world-map-login.png");

export default function Step1Account() {
  const router = useRouter();
  const handleBack = useAppBack("/onboarding/step0-welcome");
  const { user, setUser, logout } = useUserStore();
  const isMountedRef = useRef(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!isMountedRef.current || !authUser) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", authUser.id)
          .single();

        if (!profile) {
          await supabase.auth.signOut();
          await logout();
          return;
        }

        InteractionManager.runAfterInteractions(() => {
          if (isMountedRef.current) router.replace("/onboarding");
        });
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    }, 300);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, [logout, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
  }, [user]);

  const validateForm = () => {
    const newErrors = {
      name: name.trim() ? "" : "Full name is required",
      email: !email.trim()
        ? "Email is required"
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
          ? "Please enter a valid email"
          : "",
      password: !password
        ? "Password is required"
        : password.length < 6
          ? "Password must be at least 6 characters"
          : "",
      confirmPassword: !confirmPassword
        ? "Please confirm your password"
        : confirmPassword !== password
          ? "Passwords do not match"
          : "",
    };

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleSignUp = async () => {
    if (!validateForm() || isProcessing) return;

    setIsProcessing(true);

    try {
      const normalizedEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        Alert.alert("Registration error", error.message);
        return;
      }

      if (!data.user?.id) {
        Alert.alert("Registration error", "We could not create your account. Please try again.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          email: data.user.email || normalizedEmail,
          full_name: name.trim(),
        },
      ]);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        Alert.alert("Registration error", "Failed to create your profile. Please try again.");
        return;
      }

      setUser({
        ...user!,
        id: data.user.id,
        name: name.trim(),
        email: normalizedEmail,
        onboardingStep: 2,
        subscriptionTier: user?.subscriptionTier || "free",
        isPremium: user?.isPremium || false,
      });

      posthog.identify(data.user.id, {
        $set: { name: name.trim() },
        $set_once: { first_signup_date: new Date().toISOString() },
      });
      posthog.capture("user_signed_up", { subscription_tier: "free" });

      if (isMountedRef.current) router.push("/onboarding/step2-home-country");
    } catch (error: any) {
      console.error("Signup error:", error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      if (isMountedRef.current) setIsProcessing(false);
    }
  };

  const clearError = (field: keyof typeof errors) => {
    if (!errors[field]) return;
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Image resizeMode="contain" source={worldMap} style={styles.map} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <OnboardingProgressHeader onBack={handleBack} progress={0.2} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Join UniPilot to start your international journey</Text>
          </View>

          <View style={styles.form}>
            <Input
              autoCapitalize="words"
              autoComplete="name"
              containerStyle={styles.field}
              error={errors.name}
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
              label="Full Name"
              labelStyle={styles.label}
              onChangeText={(value) => {
                setName(value);
                clearError("name");
              }}
              placeholder="Enter your full name"
              testID="register-name"
              value={name}
            />

            <Input
              autoCapitalize="none"
              autoComplete="email"
              containerStyle={styles.field}
              error={errors.email}
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
              keyboardType="email-address"
              label="Email"
              labelStyle={styles.label}
              onChangeText={(value) => {
                setEmail(value);
                clearError("email");
              }}
              placeholder="Enter your email"
              testID="register-email"
              value={email}
            />

            <Input
              autoCapitalize="none"
              autoComplete="new-password"
              containerStyle={styles.field}
              error={errors.password}
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
              label="Password"
              labelStyle={styles.label}
              onChangeText={(value) => {
                setPassword(value);
                clearError("password");
                if (errors.confirmPassword) clearError("confirmPassword");
              }}
              placeholder="••••••••"
              secureTextEntry
              showPasswordToggle
              testID="register-password"
              value={password}
            />

            <Input
              autoCapitalize="none"
              autoComplete="new-password"
              containerStyle={styles.field}
              error={errors.confirmPassword}
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
              label="Confirm Password"
              labelStyle={styles.label}
              onChangeText={(value) => {
                setConfirmPassword(value);
                clearError("confirmPassword");
              }}
              onSubmitEditing={handleSignUp}
              placeholder="••••••••"
              returnKeyType="done"
              secureTextEntry
              showPasswordToggle
              testID="register-confirm-password"
              value={confirmPassword}
            />

            <Button
              fullWidth
              loading={isProcessing}
              onPress={handleSignUp}
              style={styles.submitButton}
              testID="register-submit"
              title="Register"
            />

            <View style={styles.footerPrompt}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/sign-in")}>
                <Text style={styles.footerLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  map: {
    aspectRatio: 1,
    left: "-53%",
    opacity: 0.11,
    position: "absolute",
    top: -20,
    width: "277%",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 26,
    paddingHorizontal: 24,
    paddingTop: 62,
  },
  header: {
    alignItems: "center",
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.55,
    textAlign: "center",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  form: {
    marginTop: 30,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderWidth: 1.5,
    height: 52,
  },
  input: {
    color: "#111827",
    fontSize: 15,
    height: 52,
    paddingVertical: 0,
  },
  submitButton: {
    borderRadius: 28,
    height: 56,
    marginTop: 12,
  },
  footerPrompt: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    color: "#64748B",
    fontSize: 14,
  },
  footerLink: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
});
