import React, { useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MailCheck } from "lucide-react-native";
import Button from "@/components/Button";
import AuthShell from "@/components/auth/AuthShell";
import { useAppBack } from "@/hooks/useAppBack";
import { friendlyAuthError, resendVerification, verifyEmailCode } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { posthog } from "@/src/config/posthog";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

/** "Check your inbox": enter the emailed code, or tap the link in the email. */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const handleBack = useAppBack("/onboarding/step1-account");
  const { email = "", resend } = useLocalSearchParams<{ email?: string; resend?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(resend ? 0 : RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Coming from log in with an unverified address: send a fresh code.
  useEffect(() => {
    if (resend && email) handleResend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verified via the email link (auth/callback) while this screen was open.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user.email_confirmed_at) router.replace("/onboarding");
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || verifying) return;
    setVerifying(true);
    setError("");
    try {
      const session = await verifyEmailCode(email, value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
      posthog.identify(session.user.id);
      posthog.capture("email_verified");
      router.replace("/onboarding");
    } catch (verifyError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
      setError(friendlyAuthError(verifyError));
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setError("");
    try {
      await resendVerification(email);
      setNotice("We sent a new code. It can take a minute to arrive.");
      setCooldown(RESEND_COOLDOWN);
    } catch (resendError) {
      setError(friendlyAuthError(resendError));
    }
  };

  return (
    <AuthShell
      Icon={MailCheck}
      onBack={handleBack}
      subtitle={
        <>
          We sent a {CODE_LENGTH}-digit code to{"\n"}
          <Text style={styles.email}>{email || "your email"}</Text>
        </>
      }
      title="Check your inbox"
    >
      <Pressable accessibilityLabel="Verification code" onPress={() => inputRef.current?.focus()} style={styles.codeRow}>
        {Array.from({ length: CODE_LENGTH }).map((_, index) => {
          const char = code[index];
          const active = index === Math.min(code.length, CODE_LENGTH - 1);
          return (
            <View key={index} style={[styles.codeBox, active && styles.codeBoxActive, !!error && styles.codeBoxError]}>
              <Text style={styles.codeChar}>{char ?? ""}</Text>
            </View>
          );
        })}
        <TextInput
          ref={inputRef}
          autoComplete="one-time-code"
          autoFocus
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          onChangeText={(value) => {
            const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
            setCode(digits);
            setError("");
            if (digits.length === CODE_LENGTH) verify(digits);
          }}
          style={styles.hiddenInput}
          textContentType="oneTimeCode"
          value={code}
        />
      </Pressable>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : notice ? (
        <Text style={styles.notice}>{notice}</Text>
      ) : (
        <Text style={styles.hint}>You can also tap the confirmation link in the email.</Text>
      )}

      <Button
        disabled={code.length !== CODE_LENGTH}
        fullWidth
        loading={verifying}
        onPress={() => verify(code)}
        style={styles.button}
        title="Verify email"
      />

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => Linking.openURL("message://").catch(() => null)}
        style={styles.secondary}
      >
        <Text style={styles.secondaryText}>Open Mail</Text>
      </TouchableOpacity>

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn&apos;t get it? Check spam, or </Text>
        <TouchableOpacity disabled={cooldown > 0} onPress={handleResend}>
          <Text style={[styles.resendLink, cooldown > 0 && styles.resendDisabled]}>
            {cooldown > 0 ? `resend in ${cooldown}s` : "resend code"}
          </Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  email: {
    color: "#111827",
    fontWeight: "700",
  },
  codeRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  codeBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1.5,
    height: 58,
    justifyContent: "center",
    width: 48,
  },
  codeBoxActive: {
    borderColor: "#FF6B6B",
  },
  codeBoxError: {
    borderColor: "#E5484D",
  },
  codeChar: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
  },
  hiddenInput: {
    height: 1,
    opacity: 0,
    position: "absolute",
    width: 1,
  },
  error: {
    color: "#E5484D",
    fontSize: 14,
    marginTop: 14,
    textAlign: "center",
  },
  notice: {
    color: "#139C8F",
    fontSize: 14,
    marginTop: 14,
    textAlign: "center",
  },
  hint: {
    color: "#94A3B8",
    fontSize: 13.5,
    marginTop: 14,
    textAlign: "center",
  },
  button: {
    borderRadius: 28,
    height: 56,
    marginTop: 26,
  },
  secondary: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 28,
    borderWidth: 1.5,
    height: 54,
    justifyContent: "center",
    marginTop: 12,
  },
  secondaryText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  resendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
  },
  resendText: {
    color: "#64748B",
    fontSize: 14,
  },
  resendLink: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "700",
  },
  resendDisabled: {
    color: "#B8B8C6",
  },
});
