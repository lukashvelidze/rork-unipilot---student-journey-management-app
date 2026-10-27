import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  CloudUpload,
  FileText,
  FolderOpen,
  Files,
  LucideIcon,
  MessagesSquare,
  TrendingUp,
} from "lucide-react-native";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { fetchInterviewUsage, InterviewUsage } from "@/lib/interview";

type Tool = {
  key: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  badge?: string;
  comingSoon?: boolean;
  onPress?: () => void;
};

/** All UniPilot tools outside the journey roadmap. */
export default function ToolkitScreen() {
  const router = useRouter();
  const handleBack = useAppBack("/(tabs)/premium");
  const [usage, setUsage] = useState<InterviewUsage | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchInterviewUsage().then(setUsage);
    }, []),
  );

  const interviewBadge = !usage
    ? undefined
    : usage.unlimited
      ? "Unlimited"
      : (usage.remaining ?? 0) > 0
        ? `Free Session: ${Math.min(usage.used + 1, usage.limit ?? 3)} of ${usage.limit}`
        : "Free sessions used";

  const comingSoon = (title: string) =>
    Alert.alert("Coming soon", `${title} is on its way. We'll let you know when it's ready.`);

  const featured: Tool[] = [
    {
      key: "interview",
      title: "AI Interview Simulator",
      description: "Practice university and visa interviews with AI",
      Icon: AudioLines,
      badge: interviewBadge,
      onPress: () => router.push("/premium/interview-simulator" as any),
    },
    {
      key: "resume",
      title: "AI Resume Feedback",
      description: "Line-by-line suggestions for your CV",
      Icon: FileText,
      comingSoon: true,
    },
    {
      key: "vault",
      title: "Document Vault",
      description: "Passports, transcripts and offers in one place",
      Icon: FolderOpen,
      onPress: () => router.push("/(tabs)/documents" as any),
    },
    {
      key: "career",
      title: "Career readiness monitor",
      description: "Track skills employers look for",
      Icon: TrendingUp,
      comingSoon: true,
    },
  ];

  const categories: Tool[] = [
    {
      key: "upload",
      title: "Upload resume",
      description: "Add your CV to the document vault",
      Icon: CloudUpload,
      onPress: () => router.push("/documents/new" as any),
    },
    {
      key: "readiness",
      title: "Interview Readiness",
      description: "Run a mock interview and get scored",
      Icon: MessagesSquare,
      onPress: () => router.push("/premium/interview-simulator" as any),
    },
    {
      key: "uploads",
      title: "My Uploads",
      description: "Everything you've stored",
      Icon: Files,
      onPress: () => router.push("/(tabs)/documents" as any),
    },
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity accessibilityLabel="Go back" hitSlop={10} onPress={handleBack} style={styles.back}>
          <ArrowLeft color={UI.text} size={22} strokeWidth={2} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.title}>
          Your Toolkit
        </Text>

        <Text style={styles.sectionTitle}>Featured</Text>
        <View style={styles.grid}>
          {featured.map((tool) => (
            <Pressable
              key={tool.key}
              accessibilityLabel={`${tool.title}${tool.comingSoon ? ", coming soon" : ""}`}
              accessibilityRole="button"
              onPress={() => (tool.comingSoon ? comingSoon(tool.title) : tool.onPress?.())}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <View style={styles.tileTop}>
                <tool.Icon color={UI.primary} size={26} strokeWidth={1.8} />
                {tool.comingSoon ? (
                  <View style={[styles.badge, styles.badgeMuted]}>
                    <Text style={[styles.badgeText, styles.badgeTextMuted]}>Soon</Text>
                  </View>
                ) : tool.badge ? (
                  <View style={styles.badge}>
                    <Text numberOfLines={1} style={styles.badgeText}>
                      {tool.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tileTitle, tool.comingSoon && styles.tileTitleMuted]}>{tool.title}</Text>
              <Text numberOfLines={2} style={styles.tileText}>
                {tool.description}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Browse By Category</Text>
        <View style={styles.rows}>
          {categories.map((tool) => (
            <Pressable
              key={tool.key}
              accessibilityRole="button"
              onPress={tool.onPress}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <tool.Icon color={UI.primary} size={24} strokeWidth={1.8} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{tool.title}</Text>
                <Text numberOfLines={1} style={styles.rowText}>
                  {tool.description}
                </Text>
              </View>
              <ArrowRight color={UI.textSecondary} size={20} strokeWidth={1.8} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  content: {
    paddingBottom: 60,
    paddingHorizontal: GUTTER,
  },
  back: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    marginLeft: -10,
    marginTop: 4,
    width: 44,
  },
  title: {
    color: UI.primary,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 8,
  },
  sectionTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tile: {
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: RADIUS.tile,
    borderWidth: 1,
    minHeight: 132,
    padding: 14,
    width: "48%",
  },
  pressed: {
    opacity: 0.85,
  },
  tileTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 14,
  },
  badge: {
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.pill,
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMuted: {
    backgroundColor: "#F1F1F6",
  },
  badgeText: {
    color: UI.primary,
    fontSize: 10.5,
    fontWeight: "800",
  },
  badgeTextMuted: {
    color: UI.textSecondary,
  },
  tileTitle: {
    color: UI.text,
    fontSize: 14.5,
    fontWeight: "700",
  },
  tileTitleMuted: {
    color: UI.textSecondary,
  },
  tileText: {
    color: UI.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  rows: {
    gap: 12,
  },
  row: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: RADIUS.tile,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...CARD_SHADOW,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "700",
  },
  rowText: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 2,
  },
});
