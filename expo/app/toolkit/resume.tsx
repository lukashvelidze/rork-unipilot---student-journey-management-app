import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { ArrowLeft, CircleAlert, CloudUpload, FileText, Star } from "lucide-react-native";
import ProgressRing from "@/components/ui/ProgressRing";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { fetchLatestResumeReview, ResumeReview, reviewResume } from "@/lib/toolkit";

/** AI Resume Feedback: upload a CV, get a score and line-by-line suggestions. */
export default function ResumeFeedbackScreen() {
  const handleBack = useAppBack("/toolkit");
  const [review, setReview] = useState<ResumeReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchLatestResumeReview()
        .then(setReview)
        .finally(() => setLoading(false));
    }, []),
  );

  const pickAndReview = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType || (asset.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");

    setReviewing(true);
    try {
      const next = await reviewResume({ uri: asset.uri, name: asset.name, mimeType, size: asset.size });
      setReview(next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    } catch (error) {
      Alert.alert("Couldn't review your CV", (error as Error).message);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" hitSlop={8} onPress={handleBack} style={styles.back}>
          <ArrowLeft color={UI.text} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Resume Feedback</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          disabled={reviewing}
          onPress={pickAndReview}
          style={styles.upload}
        >
          {reviewing ? (
            <>
              <ActivityIndicator color={UI.primary} size="large" />
              <Text style={styles.uploadTitle}>Reading your CV…</Text>
              <Text style={styles.uploadText}>This usually takes 10–20 seconds.</Text>
            </>
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <CloudUpload color={UI.primary} size={26} strokeWidth={1.8} />
              </View>
              <Text style={styles.uploadTitle}>{review ? "Review a new version" : "Upload your CV"}</Text>
              <Text style={styles.uploadText}>PDF or a photo, up to 7 MB. We don't store the file.</Text>
            </>
          )}
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color={UI.primary} style={styles.loading} />
        ) : review ? (
          <>
            <View style={styles.scoreCard}>
              <ProgressRing labelSize={15} progress={review.score * 10} size={62} />
              <View style={styles.scoreCopy}>
                <Text style={styles.scoreTitle}>Score: {review.score}/10</Text>
                <View style={styles.fileRow}>
                  <FileText color={UI.muted} size={13} />
                  <Text numberOfLines={1} style={styles.fileName}>
                    {review.file_name || "Your CV"}
                    {review.created_at ? ` · ${new Date(review.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}
                  </Text>
                </View>
              </View>
            </View>
            {review.summary ? <Text style={styles.summary}>{review.summary}</Text> : null}

            {review.strengths ? (
              <View style={styles.block}>
                <View style={styles.blockHeading}>
                  <Star color={UI.success} size={15} strokeWidth={2.2} />
                  <Text style={[styles.blockLabel, { color: UI.success }]}>KEY STRENGTHS</Text>
                </View>
                <Text style={styles.blockText}>{review.strengths}</Text>
              </View>
            ) : null}

            <View style={styles.blockHeading}>
              <CircleAlert color={UI.primary} size={15} strokeWidth={2.2} />
              <Text style={[styles.blockLabel, { color: UI.primary }]}>SUGGESTIONS</Text>
            </View>
            <View style={styles.list}>
              {review.suggestions.map((item, index) => (
                <View key={`${item.section}-${index}`} style={[styles.suggestion, index > 0 && styles.suggestionDivider]}>
                  <View style={styles.sectionPill}>
                    <Text style={styles.sectionPillText}>{item.section.toUpperCase()}</Text>
                  </View>
                  {item.issue ? <Text style={styles.issue}>{item.issue}</Text> : null}
                  <Text style={styles.fix}>{item.suggestion}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.empty}>
            Get a readiness score for international applications and concrete, line-by-line improvements.
          </Text>
        )}
      </ScrollView>
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
  content: { paddingBottom: 60, paddingHorizontal: GUTTER },
  upload: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderColor: "#FFC9C9",
    borderRadius: RADIUS.card,
    borderStyle: "dashed",
    borderWidth: 1.5,
    marginTop: 8,
    minHeight: 170,
    justifyContent: "center",
    padding: 22,
  },
  uploadIcon: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  uploadTitle: { color: UI.text, fontSize: 16.5, fontWeight: "700", marginTop: 12 },
  uploadText: { color: UI.textSecondary, fontSize: 13, marginTop: 4, textAlign: "center" },
  loading: { marginTop: 40 },
  empty: { color: UI.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 20, textAlign: "center" },
  scoreCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
    padding: 16,
    ...CARD_SHADOW,
  },
  scoreCopy: { flex: 1 },
  scoreTitle: { color: UI.text, fontSize: 18, fontWeight: "800" },
  fileRow: { alignItems: "center", flexDirection: "row", gap: 5, marginTop: 4 },
  fileName: { color: UI.muted, flex: 1, fontSize: 12.5 },
  summary: { color: UI.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 14 },
  block: { marginTop: 18 },
  blockHeading: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 8, marginTop: 18 },
  blockLabel: { fontSize: 12.5, fontWeight: "800", letterSpacing: 0.6 },
  blockText: { color: UI.textSecondary, fontSize: 14, lineHeight: 20 },
  list: { backgroundColor: UI.card, borderRadius: RADIUS.tile, paddingHorizontal: 16, ...CARD_SHADOW },
  suggestion: { paddingVertical: 14 },
  suggestionDivider: { borderTopColor: UI.hairline, borderTopWidth: 1 },
  sectionPill: {
    alignSelf: "flex-start",
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionPillText: { color: UI.primary, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 },
  issue: { color: UI.muted, fontSize: 13, lineHeight: 18, marginTop: 8 },
  fix: { color: UI.text, fontSize: 14.5, lineHeight: 20, marginTop: 6 },
});
