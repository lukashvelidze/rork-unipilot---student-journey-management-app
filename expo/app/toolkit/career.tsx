import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft, ArrowRight, Check } from "lucide-react-native";
import ProgressRing from "@/components/ui/ProgressRing";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { CAREER_SKILLS, CareerReadiness, fetchCareerReadiness, saveCareerSkills } from "@/lib/toolkit";

const levelFor = (score: number) =>
  score >= 75 ? "Ready to impress" : score >= 50 ? "Getting there" : score >= 25 ? "Building up" : "Just starting";

/** Career Readiness Monitor: one score from skills, CV, interviews, profile and tasks. */
export default function CareerReadinessScreen() {
  const router = useRouter();
  const handleBack = useAppBack("/toolkit");
  const [data, setData] = useState<CareerReadiness | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    fetchCareerReadiness()
      .then((result) => {
        setData(result);
        setSkills(result.skills);
      })
      .catch((error) => console.error("Could not load career readiness:", error));
  }, []);

  useFocusEffect(load);

  const toggleSkill = (key: string) => {
    Haptics.selectionAsync().catch(() => null);
    const next = skills.includes(key) ? skills.filter((s) => s !== key) : [...skills, key];
    setSkills(next);
    // Update the score immediately; persist after the student stops tapping.
    setData((current) => {
      if (!current) return current;
      const factors = current.factors.map((f) =>
        f.key === "skills"
          ? { ...f, value: next.length / CAREER_SKILLS.length, detail: `${next.length} of ${CAREER_SKILLS.length} skills built` }
          : f,
      );
      return { ...current, factors, score: Math.round(factors.reduce((s, f) => s + f.value * f.weight, 0) * 100) };
    });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveCareerSkills(next).catch(() => Alert.alert("Couldn't save", "Please check your connection."));
    }, 600);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" hitSlop={8} onPress={handleBack} style={styles.back}>
          <ArrowLeft color={UI.text} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Career readiness</Text>
        <View style={styles.spacer} />
      </View>

      {!data ? (
        <ActivityIndicator color={UI.primary} style={styles.loading} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <ProgressRing labelSize={20} progress={data.score} size={92} stroke={6} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroLevel}>{levelFor(data.score)}</Text>
              <Text style={styles.heroText}>
                How ready you are for internships and graduate jobs abroad, based on the five areas below.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Breakdown</Text>
          <View style={styles.card}>
            {data.factors.map((factor, index) => (
              <View key={factor.key} style={[styles.factor, index > 0 && styles.divider]}>
                <View style={styles.factorTop}>
                  <Text style={styles.factorLabel}>{factor.label}</Text>
                  <Text style={styles.factorWeight}>{Math.round(factor.weight * 100)}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(factor.value * 100)}%` }]} />
                </View>
                <View style={styles.factorBottom}>
                  <Text style={styles.factorDetail}>{factor.detail}</Text>
                  {factor.action ? (
                    <TouchableOpacity hitSlop={8} onPress={() => router.push(factor.action!.route as any)} style={styles.factorAction}>
                      <Text style={styles.factorActionText}>{factor.action.label}</Text>
                      <ArrowRight color={UI.primary} size={13} strokeWidth={2.4} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Skills you've built</Text>
          <Text style={styles.sectionHint}>Tick everything you could give an example of in an interview.</Text>
          <View style={styles.skills}>
            {CAREER_SKILLS.map((skill) => {
              const active = skills.includes(skill.key);
              return (
                <Pressable
                  key={skill.key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  onPress={() => toggleSkill(skill.key)}
                  style={[styles.skill, active && styles.skillActive]}
                >
                  <View style={[styles.check, active && styles.checkActive]}>
                    {active ? <Check color="#FFFFFF" size={12} strokeWidth={3} /> : null}
                  </View>
                  <View style={styles.skillCopy}>
                    <Text style={styles.skillLabel}>{skill.label}</Text>
                    <Text numberOfLines={1} style={styles.skillHint}>{skill.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: UI.background, flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingHorizontal: GUTTER - 4,
    paddingTop: 6,
  },
  back: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
    ...CARD_SHADOW,
  },
  spacer: { width: 40 },
  headerTitle: { color: UI.text, fontSize: 18, fontWeight: "700" },
  loading: { marginTop: 60 },
  content: { paddingBottom: 60, paddingHorizontal: GUTTER },
  hero: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 22,
    flexDirection: "row",
    gap: 16,
    marginTop: 6,
    padding: 18,
    ...CARD_SHADOW,
  },
  heroCopy: { flex: 1 },
  heroLevel: { color: UI.text, fontSize: 19, fontWeight: "800" },
  heroText: { color: UI.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: UI.text, fontSize: 17, fontWeight: "700", marginBottom: 10, marginTop: 24 },
  sectionHint: { color: UI.muted, fontSize: 13, marginBottom: 10, marginTop: -4 },
  card: { backgroundColor: UI.card, borderRadius: RADIUS.tile, paddingHorizontal: 16, ...CARD_SHADOW },
  factor: { paddingVertical: 14 },
  divider: { borderTopColor: UI.hairline, borderTopWidth: 1 },
  factorTop: { flexDirection: "row", justifyContent: "space-between" },
  factorLabel: { color: UI.text, fontSize: 14.5, fontWeight: "600" },
  factorWeight: { color: UI.muted, fontSize: 12 },
  track: { backgroundColor: UI.track, borderRadius: 4, height: 6, marginTop: 9, overflow: "hidden" },
  fill: { backgroundColor: UI.primary, borderRadius: 4, height: "100%" },
  factorBottom: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  factorDetail: { color: UI.muted, flex: 1, fontSize: 12.5 },
  factorAction: { alignItems: "center", flexDirection: "row", gap: 3 },
  factorActionText: { color: UI.primary, fontSize: 12.5, fontWeight: "700" },
  skills: { gap: 10 },
  skill: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  skillActive: { backgroundColor: UI.primarySoft, borderColor: UI.primary },
  check: {
    alignItems: "center",
    borderColor: "#C9C9D4",
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  checkActive: { backgroundColor: UI.primary, borderColor: UI.primary },
  skillCopy: { flex: 1 },
  skillLabel: { color: UI.text, fontSize: 15, fontWeight: "600" },
  skillHint: { color: UI.muted, fontSize: 12.5, marginTop: 2 },
});
