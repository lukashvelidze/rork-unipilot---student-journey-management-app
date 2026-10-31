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
import * as WebBrowser from "expo-web-browser";
import Button from "@/components/Button";
import Input from "@/components/Input";
import OnboardingProgressHeader from "@/components/onboarding/OnboardingProgressHeader";
import { useAppBack } from "@/hooks/useAppBack";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import { posthog } from "@/src/config/posthog";
import PasswordStrength from "@/components/auth/PasswordStrength";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import {
  AuthFlowError,
  friendlyAuthError,
  PASSWORD_MIN_SCORE,
  passwordScore,
  signInWithApple,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth";

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
  const [socialBusy, setSocialBusy] = useState<"apple" | "google" | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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
        : passwordScore(password, email) < PASSWORD_MIN_SCORE
          ? "Choose a stronger password (see the checklist below)"
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
    if (!acceptedTerms) {
      Alert.alert("One more thing", "Please accept the Terms of Use and Privacy Policy to create your account.");
      return;
    }

    setIsProcessing(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const session = await signUpWithEmail({ name: name.trim(), email: normalizedEmail, password });
      posthog.capture("user_signed_up", { method: "email", needs_verification: !session });

      if (!session) {
        // Confirm-email is on: verify, then onboarding resumes from the profile.
        router.push({ pathname: "/verify-email", params: { email: normalizedEmail } } as any);
        return;
      }

      setUser({
        ...user!,
        id: session.user.id,
        name: name.trim(),
        email: normalizedEmail,
        onboardingStep: 2,
        subscriptionTier: user?.subscriptionTier || "free",
        isPremium: user?.isPremium || false,
      });
      posthog.identify(session.user.id, {
        $set: { name: name.trim() },
        $set_once: { first_signup_date: new Date().toISOString() },
      });

      if (isMountedRef.current) router.push("/onboarding/step2-home-country");
    } catch (error) {
      Alert.alert("Couldn't create your account", friendlyAuthError(error));
    } finally {
      if (isMountedRef.current) setIsProcessing(false);
    }
  };

  const handleSocial = async (provider: "apple" | "google") => {
    if (socialBusy || isProcessing) return;
    setSocialBusy(provider);
    try {
      const session = provider === "apple" ? await signInWithApple() : await signInWithGoogle();
      posthog.identify(session.user.id);
      posthog.capture("user_signed_up", { method: provider });
      // Resumes onboarding at the first unanswered step.
      router.replace("/onboarding");
    } catch (error) {
      if (!(error instanceof AuthFlowError && error.code === "cancelled")) {
        Alert.alert("Couldn't sign up", friendlyAuthError(error));
      }
    } finally {
      if (isMountedRef.current) setSocialBusy(null);
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
            <SocialAuthButtons busy={socialBusy} disabled={isProcessing} mode="signup" onPress={handleSocial} />

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
            <PasswordStrength email={email.trim()} password={password} />

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

            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
              activeOpacity={0.7}
              onPress={() => setAcceptedTerms((value) => !value)}
              style={styles.terms}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text onPress={() => WebBrowser.openBrowserAsync("https://unipilot.app/terms")} style={styles.termsLink}>
                  Terms of Use
                </Text>{" "}
                and{" "}
                <Text onPress={() => WebBrowser.openBrowserAsync("https://unipilot.app/privacy")} style={styles.termsLink}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

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
    paddingTop: 40,
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
  terms: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
    marginTop: 2,
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: 6,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  checkboxMark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  termsText: {
    color: "#64748B",
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
  },
  termsLink: {
    color: "#FF6B6B",
    fontWeight: "600",
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
