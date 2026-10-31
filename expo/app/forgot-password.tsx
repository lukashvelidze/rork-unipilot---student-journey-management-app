import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { KeyRound, MailCheck } from "lucide-react-native";
import Button from "@/components/Button";
import Input from "@/components/Input";
import AuthShell from "@/components/auth/AuthShell";
import { useAppBack } from "@/hooks/useAppBack";
import { friendlyAuthError, sendPasswordReset } from "@/lib/auth";

/** Request a password reset link; the link opens app/auth/callback. */
export default function ForgotPasswordScreen() {
  const handleBack = useAppBack("/sign-in");
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const send = async () => {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError("Please enter a valid email address");
      return;
    }
    setSending(true);
    setError("");
    try {
      await sendPasswordReset(normalized);
      setSentTo(normalized);
    } catch (sendError) {
      setError(friendlyAuthError(sendError));
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell
        Icon={MailCheck}
        onBack={handleBack}
        subtitle={
          <>
            If an account exists for <Text style={styles.strong}>{sentTo}</Text>, you&apos;ll get a link to choose a new
            password. Open it on this phone.
          </>
        }
        title="Check your email"
      >
        <Button fullWidth onPress={handleBack} style={styles.button} title="Back to log in" />
        <TouchableOpacity onPress={() => setSentTo(null)} style={styles.link}>
          <Text style={styles.linkText}>Use a different email</Text>
        </TouchableOpacity>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      Icon={KeyRound}
      onBack={handleBack}
      subtitle="Enter the email you signed up with and we'll send you a reset link."
      title="Forgot your password?"
    >
      <Input
        autoCapitalize="none"
        autoComplete="email"
        autoFocus={!email}
        containerStyle={styles.field}
        error={error}
        inputContainerStyle={styles.inputContainer}
        inputStyle={styles.input}
        keyboardType="email-address"
        label="Email"
        labelStyle={styles.label}
        onChangeText={(value) => {
          setEmail(value);
          setError("");
        }}
        onSubmitEditing={send}
        placeholder="you@example.com"
        returnKeyType="send"
        value={email}
      />
      <Button fullWidth loading={sending} onPress={send} style={styles.button} title="Send reset link" />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  strong: {
    color: "#111827",
    fontWeight: "700",
  },
  field: {
    marginBottom: 8,
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
  button: {
    borderRadius: 28,
    height: 56,
    marginTop: 16,
  },
  link: {
    alignItems: "center",
    marginTop: 18,
  },
  linkText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
});
