import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Check, Circle } from "lucide-react-native";
import { passwordChecks, passwordScore } from "@/lib/auth";

const LEVELS = [
  { label: "Too weak", color: "#E5484D" },
  { label: "Weak", color: "#E5484D" },
  { label: "Fair", color: "#F5A524" },
  { label: "Good", color: "#2EC4B6" },
  { label: "Strong", color: "#139C8F" },
] as const;

/** Live strength meter and checklist under a new-password field. */
export default function PasswordStrength({ password, email }: { password: string; email?: string }) {
  if (!password) return null;
  const score = passwordScore(password, email);
  const level = LEVELS[score];
  const checks = passwordChecks(password, email);

  return (
    <View accessibilityLabel={`Password strength: ${level.label}`} style={styles.container}>
      <View style={styles.meterRow}>
        <View style={styles.meter}>
          {[1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={[styles.segment, { backgroundColor: step <= score ? level.color : "#E9E9EF" }]}
            />
          ))}
        </View>
        <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
      </View>
      <View style={styles.checks}>
        {checks.map((check) => (
          <View key={check.id} style={styles.check}>
            {check.met ? (
              <Check color="#139C8F" size={13} strokeWidth={3} />
            ) : (
              <Circle color="#B8B8C6" size={11} strokeWidth={2} />
            )}
            <Text style={[styles.checkText, check.met && styles.checkTextMet]}>{check.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
    marginTop: -8,
  },
  meterRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  meter: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  segment: {
    borderRadius: 2,
    flex: 1,
    height: 4,
  },
  levelText: {
    fontSize: 12.5,
    fontWeight: "700",
    minWidth: 52,
    textAlign: "right",
  },
  checks: {
    gap: 4,
    marginTop: 10,
  },
  check: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  checkText: {
    color: "#8E8EA0",
    fontSize: 12.5,
  },
  checkTextMet: {
    color: "#4B5563",
  },
});
