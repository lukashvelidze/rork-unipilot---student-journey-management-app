import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ArrowLeft, ChevronRight, GraduationCap, Plus, Star, Trash2 } from "lucide-react-native";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { getCountries, supabase } from "@/lib/supabase";
import { Country } from "@/types/user";
import {
  countryFlag,
  deleteUserJourney,
  fetchUserJourneys,
  setPrimaryJourney,
  UserJourneyWithUniversity,
} from "@/lib/journeyRoutes";

/** Every university the student follows, grouped by country. */
export default function DestinationsScreen() {
  const router = useRouter();
  const handleBack = useAppBack("/(tabs)/profile");

  const [journeys, setJourneys] = useState<UserJourneyWithUniversity[]>([]);
  const [destinationCountries, setDestinationCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      const [journeyRows, countries] = await Promise.all([fetchUserJourneys(authUser.id), getCountries()]);
      setJourneys(journeyRows);
      setDestinationCountries(countries.destination || []);
    } catch (error) {
      console.error("Error loading destinations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Universities can be added from the picker; refresh on return.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const grouped = useMemo(() => {
    const map = new Map<string, UserJourneyWithUniversity[]>();
    for (const j of journeys) {
      const key = j.destination_country_code.toUpperCase();
      map.set(key, [...(map.get(key) || []), j]);
    }
    return Array.from(map.entries());
  }, [journeys]);

  const countryName = (code: string) =>
    destinationCountries.find((c) => c.code.toUpperCase() === code.toUpperCase())?.name || code;

  const handleMakePrimary = async (journeyId: string) => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      await setPrimaryJourney(authUser.id, journeyId);

      const journey = journeys.find((j) => j.id === journeyId);
      if (journey) {
        const update: Record<string, string> = {
          destination_country: journey.destination_country_code,
          updated_at: new Date().toISOString(),
        };
        if (journey.country_visa_type) update.visa_type = journey.country_visa_type;
        await supabase.from("profiles").update(update).eq("id", authUser.id);
      }
      await load();
    } catch {
      Alert.alert("Could not update", "Please try again.");
    }
  };

  const handleRemove = (journey: UserJourneyWithUniversity) => {
    Alert.alert(
      "Remove university",
      `Remove ${journey.university?.name || "this university"} from your journeys? Your task progress for it stays saved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const {
                data: { user: authUser },
              } = await supabase.auth.getUser();
              if (!authUser) return;
              await deleteUserJourney(authUser.id, journey.id);
              await load();
            } catch {
              Alert.alert("Could not remove", "Please try again.");
            }
          },
        },
      ],
    );
  };

  const addUniversities = () => router.push("/onboarding/step-universities?mode=manage" as any);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={handleBack} style={styles.roundButton}>
          <ArrowLeft color={UI.text} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          My destinations
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={UI.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Each university has its own roadmap. Your primary one opens first on the Journey tab.
          </Text>

          {grouped.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <GraduationCap color={UI.primary} size={26} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>No universities yet</Text>
              <Text style={styles.emptyText}>Add the universities you're applying to and we'll build a roadmap for each.</Text>
            </View>
          ) : (
            grouped.map(([code, list]) => (
              <View key={code} style={styles.group}>
                <Text style={styles.groupTitle}>
                  {countryFlag(code)} {countryName(code)}
                </Text>
                <View style={styles.groupCard}>
                  {list.map((journey, index) => (
                    <JourneyRow
                      key={journey.id}
                      first={index === 0}
                      journey={journey}
                      onMakePrimary={() => handleMakePrimary(journey.id)}
                      onOpen={() =>
                        journey.university && router.push(`/university/${journey.university.id}` as any)
                      }
                      onRemove={() => handleRemove(journey)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.88}
            onPress={addUniversities}
            style={styles.addButton}
          >
            <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
            <Text style={styles.addButtonText}>Add universities</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function JourneyRow({
  journey,
  first,
  onOpen,
  onMakePrimary,
  onRemove,
}: {
  journey: UserJourneyWithUniversity;
  first: boolean;
  onOpen: () => void;
  onMakePrimary: () => void;
  onRemove: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const university = journey.university;
  return (
    <View style={[styles.row, !first && styles.rowDivider]}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.rowMain}>
        <View style={styles.logo}>
          {university?.logo_url && !logoFailed ? (
            <Image
              contentFit="contain"
              onError={() => setLogoFailed(true)}
              source={{ uri: university.logo_url }}
              style={styles.logoImage}
            />
          ) : (
            <GraduationCap color={UI.primary} size={20} strokeWidth={1.8} />
          )}
        </View>
        <View style={styles.rowCopy}>
          <Text numberOfLines={2} style={styles.rowTitle}>
            {university?.name || "University"}
          </Text>
          {journey.is_primary ? (
            <View style={styles.primaryPill}>
              <Star color={UI.primary} fill={UI.primary} size={10} />
              <Text style={styles.primaryText}>Primary</Text>
            </View>
          ) : (
            <TouchableOpacity hitSlop={8} onPress={onMakePrimary}>
              <Text style={styles.makePrimary}>Make primary</Text>
            </TouchableOpacity>
          )}
        </View>
        <ChevronRight color={UI.muted} size={18} strokeWidth={2} />
      </Pressable>
      <TouchableOpacity
        accessibilityLabel={`Remove ${university?.name || "university"}`}
        hitSlop={8}
        onPress={onRemove}
        style={styles.removeButton}
      >
        <Trash2 color={UI.danger} size={17} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingHorizontal: GUTTER - 4,
    paddingTop: 6,
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
    ...CARD_SHADOW,
  },
  headerTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  content: {
    paddingBottom: 48,
    paddingHorizontal: GUTTER,
  },
  subtitle: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    marginTop: 20,
    padding: 24,
    ...CARD_SHADOW,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    marginBottom: 12,
    width: 56,
  },
  emptyTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: UI.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  group: {
    marginTop: 22,
  },
  groupTitle: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  groupCard: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    ...CARD_SHADOW,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 12,
  },
  rowDivider: {
    borderTopColor: UI.hairline,
    borderTopWidth: 1,
  },
  rowMain: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  logo: {
    alignItems: "center",
    backgroundColor: UI.hairline,
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: 44,
  },
  logoImage: {
    height: 34,
    width: 34,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  primaryText: {
    color: UI.primary,
    fontSize: 11.5,
    fontWeight: "800",
  },
  makePrimary: {
    color: UI.textSecondary,
    fontSize: 12.5,
    fontWeight: "600",
  },
  removeButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 28,
    flexDirection: "row",
    gap: 8,
    height: 54,
    justifyContent: "center",
    marginTop: 28,
    shadowColor: UI.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
