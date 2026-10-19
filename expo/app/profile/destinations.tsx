import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, GraduationCap, MapPin, Plus, Star, Trash2 } from "lucide-react-native";
import { useAppBack } from "@/hooks/useAppBack";
import { useColors } from "@/hooks/useColors";
import Button from "@/components/Button";
import Card from "@/components/Card";
import CountrySelector from "@/components/CountrySelector";
import { getCountries, supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { Country } from "@/types/user";
import {
  deleteUserJourney,
  fetchUniversitiesForCountry,
  fetchUserJourneys,
  offersStudyLevel,
  requestMissingJourneyRoutes,
  setPrimaryJourney,
  targetStudyLevel,
  UniversityRecord,
  UserJourneyWithUniversity,
  upsertUserJourneys,
} from "@/lib/journeyRoutes";

export default function DestinationsScreen() {
  const handleBack = useAppBack("/(tabs)/profile");
  const Colors = useColors();
  const { user } = useUserStore();

  const [journeys, setJourneys] = useState<UserJourneyWithUniversity[]>([]);
  const [destinationCountries, setDestinationCountries] = useState<Country[]>([]);
  const [profileFields, setProfileFields] = useState<{
    origin: string | null;
    level: string | null;
    visaType: string | null;
  }>({ origin: null, level: null, visaType: null });

  const [addCountry, setAddCountry] = useState<Country | null>(null);
  const [addUniversities, setAddUniversities] = useState<UniversityRecord[]>([]);
  const [addSelectedIds, setAddSelectedIds] = useState<Set<string>>(new Set());
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      const [{ data: profile }, journeyRows, countries] = await Promise.all([
        supabase
          .from("profiles")
          .select("country_origin, level_of_study, visa_type")
          .eq("id", authUser.id)
          .single(),
        fetchUserJourneys(authUser.id),
        getCountries(),
      ]);

      setProfileFields({
        origin: profile?.country_origin || user?.homeCountry?.code || null,
        level: profile?.level_of_study || user?.educationBackground?.level || null,
        visaType: profile?.visa_type || null,
      });
      setJourneys(journeyRows);
      setDestinationCountries(countries.destination || []);
    } catch (error) {
      console.error("Error loading destinations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.homeCountry?.code, user?.educationBackground?.level]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!addCountry) {
      setAddUniversities([]);
      setAddSelectedIds(new Set());
      return;
    }
    let cancelled = false;
    setLoadingUniversities(true);
    fetchUniversitiesForCountry(addCountry.code)
      .then((list) => {
        if (cancelled) return;
        const existing = new Set(
          journeys
            .filter((j) => j.destination_country_code.toUpperCase() === addCountry.code.toUpperCase())
            .map((j) => j.university_id),
        );
        const level = profileFields.level ? targetStudyLevel(profileFields.level) : null;
        setAddUniversities(
          list.filter((u) => !existing.has(u.id) && offersStudyLevel(u, level)),
        );
        setAddSelectedIds(new Set());
      })
      .finally(() => !cancelled && setLoadingUniversities(false));
    return () => {
      cancelled = true;
    };
  }, [addCountry, journeys, profileFields.level]);

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
    } catch (error) {
      Alert.alert("Could not update", "Please try again.");
    }
  };

  const handleRemove = (journey: UserJourneyWithUniversity) => {
    Alert.alert(
      "Remove destination",
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
            } catch (error) {
              Alert.alert("Could not remove", "Please try again.");
            }
          },
        },
      ],
    );
  };

  const toggleAdd = (id: string) => {
    setAddSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!addCountry || addSelectedIds.size === 0 || isSaving) return;
    if (!profileFields.origin || !profileFields.level) {
      Alert.alert("Finish your profile first", "Set your home country and education level in Edit Profile.");
      return;
    }
    setIsSaving(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      await upsertUserJourneys({
        userId: authUser.id,
        destinationCountryCode: addCountry.code,
        originCountryCode: profileFields.origin,
        educationLevel: targetStudyLevel(profileFields.level),
        countryVisaType: profileFields.visaType,
        universities: addUniversities.filter((u) => addSelectedIds.has(u.id)),
        makeFirstPrimary: journeys.length === 0,
      });
      void requestMissingJourneyRoutes();

      setAddCountry(null);
      await load();
    } catch (error) {
      Alert.alert("Could not add", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={["bottom"]} style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: Colors.text }]}>My destinations</Text>
        <Text style={[styles.subtitle, { color: Colors.lightText }]}>
          Each university has its own journey. Your primary destination shows first.
        </Text>

        {grouped.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: Colors.card }]}>
            <Text style={[styles.emptyText, { color: Colors.lightText }]}>
              No universities added yet. Add one below.
            </Text>
          </Card>
        ) : (
          grouped.map(([code, list]) => (
            <View key={code} style={styles.group}>
              <View style={styles.groupHeader}>
                <MapPin color={Colors.lightText} size={14} />
                <Text style={[styles.groupTitle, { color: Colors.text }]}>{countryName(code)}</Text>
              </View>
              {list.map((journey) => (
                <Card key={journey.id} style={[styles.journeyCard, { backgroundColor: Colors.card }]}>
                  <View style={styles.journeyRow}>
                    <GraduationCap color={Colors.primary} size={18} />
                    <View style={styles.journeyInfo}>
                      <Text style={[styles.journeyName, { color: Colors.text }]}>
                        {journey.university?.name || "University"}
                      </Text>
                      {journey.is_primary ? (
                        <Text style={[styles.primaryBadge, { color: Colors.primary }]}>Primary</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.journeyActions}>
                    {!journey.is_primary ? (
                      <TouchableOpacity
                        onPress={() => handleMakePrimary(journey.id)}
                        style={styles.actionBtn}
                      >
                        <Star color={Colors.lightText} size={16} />
                        <Text style={[styles.actionText, { color: Colors.lightText }]}>Make primary</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.actionBtn} />
                    )}
                    <TouchableOpacity onPress={() => handleRemove(journey)} style={styles.actionBtn}>
                      <Trash2 color="#DC2626" size={16} />
                      <Text style={[styles.actionText, { color: "#DC2626" }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          ))
        )}

        <View style={styles.addSection}>
          <Text style={[styles.addTitle, { color: Colors.text }]}>Add a destination</Text>
          <CountrySelector
            label="Destination country"
            value={addCountry}
            onChange={setAddCountry}
            countries={destinationCountries}
            placeholder="Select a country..."
          />

          {addCountry ? (
            loadingUniversities ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
            ) : addUniversities.length === 0 ? (
              <Text style={[styles.emptyText, { color: Colors.lightText, marginTop: 12 }]}>
                No new universities available for {addCountry.name} yet.
              </Text>
            ) : (
              <View style={styles.addList}>
                {addUniversities.map((university) => {
                  const selected = addSelectedIds.has(university.id);
                  return (
                    <TouchableOpacity
                      key={university.id}
                      onPress={() => toggleAdd(university.id)}
                      style={[
                        styles.addRow,
                        {
                          backgroundColor: Colors.card,
                          borderColor: selected ? Colors.primary : Colors.border,
                        },
                      ]}
                    >
                      <View style={styles.addRowInfo}>
                        <Text style={[styles.addRowName, { color: Colors.text }]}>{university.name}</Text>
                        {university.city ? (
                          <Text style={[styles.addRowMeta, { color: Colors.lightText }]}>
                            {university.city}
                          </Text>
                        ) : null}
                      </View>
                      {selected ? <Check color={Colors.primary} size={18} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : null}

          <Button
            fullWidth
            disabled={!addCountry || addSelectedIds.size === 0}
            loading={isSaving}
            onPress={handleAdd}
            style={styles.addButton}
            title={
              addSelectedIds.size > 0
                ? `Add ${addSelectedIds.size} ${addSelectedIds.size === 1 ? "university" : "universities"}`
                : "Add universities"
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  emptyCard: { marginTop: 20, padding: 20 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  group: { marginTop: 22 },
  groupHeader: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 10 },
  groupTitle: { fontSize: 15, fontWeight: "700" },
  journeyCard: { marginBottom: 10, padding: 14 },
  journeyRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  journeyInfo: { flex: 1 },
  journeyName: { fontSize: 15, fontWeight: "600" },
  primaryBadge: { fontSize: 11, fontWeight: "700", marginTop: 2, textTransform: "uppercase" },
  journeyActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionBtn: { alignItems: "center", flexDirection: "row", gap: 5, minWidth: 90 },
  actionText: { fontSize: 13, fontWeight: "500" },
  addSection: { marginTop: 34 },
  addTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  addList: { gap: 8, marginTop: 12 },
  addRow: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },
  addRowInfo: { flex: 1 },
  addRowName: { fontSize: 14, fontWeight: "600" },
  addRowMeta: { fontSize: 12, marginTop: 2 },
  addButton: { borderRadius: 24, height: 54, marginTop: 18 },
});
