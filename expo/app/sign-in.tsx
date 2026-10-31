import React, { useState } from "react";
import {
  Alert,
  Image,
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
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import {
  AuthFlowError,
  friendlyAuthError,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/auth";
import { posthog } from "@/src/config/posthog";

const worldMap = require("@/assets/images/onboarding/world-map-login.png");

export default function SignInScreen() {
  const router = useRouter();
  const handleBack = useAppBack("/onboarding/step0-welcome");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [socialBusy, setSocialBusy] = useState<"apple" | "google" | null>(null);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validateForm = () => {
    const newErrors = {
      email: !email.trim()
        ? "Email is required"
        : !isValidEmail(email.trim())
          ? "Please enter a valid email address"
          : "",
      password: !password ? "Password is required" : "",
    };

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  // `/onboarding` loads the profile and resumes onboarding or opens the app.
  const finish = (userId: string, method: string) => {
    posthog.identify(userId);
    posthog.capture("user_signed_in", { method });
    router.replace("/onboarding");
  };

  const handleSignIn = async () => {
    if (!validateForm() || isProcessing) return;
    setIsProcessing(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const session = await signInWithEmail(normalizedEmail, password);
      if (session) finish(session.user.id, "email");
    } catch (error) {
      if (error instanceof AuthFlowError && error.code === "unconfirmed") {
        router.push({ pathname: "/verify-email", params: { email: normalizedEmail, resend: "1" } } as any);
        return;
      }
      setErrors((current) => ({ ...current, password: friendlyAuthError(error) }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSocial = async (provider: "apple" | "google") => {
    if (socialBusy || isProcessing) return;
    setSocialBusy(provider);
    try {
      const session = provider === "apple" ? await signInWithApple() : await signInWithGoogle();
      finish(session.user.id, provider);
    } catch (error) {
      if (!(error instanceof AuthFlowError && error.code === "cancelled")) {
        Alert.alert("Couldn't sign in", friendlyAuthError(error));
      }
    } finally {
      setSocialBusy(null);
    }
  };

  const handleForgotPassword = () => {
    router.push({ pathname: "/forgot-password", params: { email: email.trim() } } as any);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Image resizeMode="contain" source={worldMap} style={styles.map} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <OnboardingProgressHeader hideProgress onBack={handleBack} progress={0} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Log in to continue your journey</Text>
          </View>

          <View style={styles.form}>
            <SocialAuthButtons busy={socialBusy} disabled={isProcessing} mode="signin" onPress={handleSocial} />

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
                if (errors.email) setErrors((current) => ({ ...current, email: "" }));
              }}
              placeholder="Enter your email"
              testID="login-email"
              value={email}
            />

            <Input
              autoCapitalize="none"
              autoComplete="password"
              containerStyle={styles.field}
              error={errors.password}
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
              label="Password"
              labelStyle={styles.label}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) setErrors((current) => ({ ...current, password: "" }));
              }}
              onSubmitEditing={handleSignIn}
              placeholder="••••••••"
              returnKeyType="go"
              secureTextEntry
              showPasswordToggle
              testID="login-password"
              value={password}
            />

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.65}
              onPress={handleForgotPassword}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              fullWidth
              loading={isProcessing}
              onPress={handleSignIn}
              style={styles.submitButton}
              testID="login-submit"
              title="Log in"
            />

            <View style={styles.footerPrompt}>
              <Text style={styles.footerText}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/onboarding/step1-account")}>
                <Text style={styles.footerLink}>Register</Text>
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
    left: "-21%",
    opacity: 0.11,
    position: "absolute",
    top: -20,
    width: "277%",
    aspectRatio: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
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
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  form: {
    marginTop: 28,
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
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -3,
  },
  forgotText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    borderRadius: 28,
    height: 56,
    marginTop: 24,
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
