import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";

export default function SignInScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, setUser } = useUserStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
    };

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).every(key => !newErrors[key as keyof typeof newErrors]);
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
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
        const updatedUser = {
          ...user!,
          id: data.user.id,
          name: profile?.full_name || data.user.email || "",
          email: profile?.email || data.user.email || "",
          onboardingCompleted: !!profile?.visa_type,
        };

        setUser(updatedUser);

        // Redirect to main app (tabs) or onboarding if not completed
        if (profile?.visa_type) {
          router.replace("/(tabs)");
        } else {
          // User exists but hasn't completed onboarding
          router.replace("/onboarding");
        }
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: Colors.text }]}>Sign In</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: Colors.lightText }]}>
              Welcome back! Sign in to continue.
            </Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                error={errors.password}
              />

              <Button
                title="Sign In"
                onPress={handleSignIn}
                loading={isProcessing}
                fullWidth
                style={styles.signInButton}
              />

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: Colors.lightText }]}>
                  Don't have an account?{" "}
                </Text>
                <TouchableOpacity onPress={() => router.push("/onboarding/step1-account")}>
                  <Text style={[styles.footerLink, { color: Colors.primary }]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 32,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  signInButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});

