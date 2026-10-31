import React, { useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import Button from "@/components/Button";
import Input from "@/components/Input";
import AuthShell from "@/components/auth/AuthShell";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { friendlyAuthError, PASSWORD_MIN_SCORE, passwordScore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/** Choose a new password after opening a reset link (recovery session). */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({ password: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = {
      password:
        passwordScore(password) < PASSWORD_MIN_SCORE ? "Choose a stronger password (see the checklist below)" : "",
      confirm: confirm !== password ? "Passwords do not match" : "",
    };
    setErrors(next);
    if (next.password || next.confirm) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert("Password updated", "You're signed in with your new password.");
      router.replace("/onboarding");
    } catch (error) {
      setErrors((current) => ({ ...current, password: friendlyAuthError(error) }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell Icon={ShieldCheck} subtitle="Pick something you haven't used before." title="Set a new password">
      <Input
        autoCapitalize="none"
        autoComplete="new-password"
        autoFocus
        containerStyle={styles.field}
        error={errors.password}
        inputContainerStyle={styles.inputContainer}
        inputStyle={styles.input}
        label="New password"
        labelStyle={styles.label}
        onChangeText={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: "" }));
        }}
        placeholder="••••••••"
        secureTextEntry
        showPasswordToggle
        textContentType="newPassword"
        value={password}
      />
      <PasswordStrength password={password} />
      <Input
        autoCapitalize="none"
        autoComplete="new-password"
        containerStyle={styles.field}
        error={errors.confirm}
        inputContainerStyle={styles.inputContainer}
        inputStyle={styles.input}
        label="Confirm password"
        labelStyle={styles.label}
        onChangeText={(value) => {
          setConfirm(value);
          setErrors((current) => ({ ...current, confirm: "" }));
        }}
        onSubmitEditing={save}
        placeholder="••••••••"
        returnKeyType="done"
        secureTextEntry
        showPasswordToggle
        textContentType="newPassword"
        value={confirm}
      />
      <Button fullWidth loading={saving} onPress={save} style={styles.button} title="Save password" />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
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
  button: {
    borderRadius: 28,
    height: 56,
    marginTop: 8,
  },
});
