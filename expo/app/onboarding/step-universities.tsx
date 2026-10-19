import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Check, GraduationCap, ListFilter, Search, X } from "lucide-react-native";
import Button from "@/components/Button";
import OnboardingProgressHeader from "@/components/onboarding/OnboardingProgressHeader";
import { useAppBack } from "@/hooks/useAppBack";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import {
  countryFlag,
  deleteUserJourney,
  fetchUniversitiesForCountry,
  fetchUserJourneys,
  formatDeadline,
  formatRankingBadge,
  formatTuitionRange,
  getUniversityLevelDetails,
  offersStudyLevel,
  requestMissingJourneyRoutes,
  targetStudyLevel,
  upcomingDeadline,
  UniversityRecord,
  UserJourneyWithUniversity,
  upsertUserJourneys,
} from "@/lib/journeyRoutes";

const CORAL = "#FF6B6B";
const TEXT = "#111827";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const MAX_SELECTION = 3;

type SortKey = "recommended" | "ranking" | "tuition" | "deadline";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "ranking", label: "World ranking" },
  { key: "tuition", label: "Tuition: low to high" },
  { key: "deadline", label: "Deadline: soonest" },
];

export default function StepUniversities() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  // "manage": opened from the journey screens after onboarding, returns there.
  const isManaging = params.mode === "manage";
  const handleBack = useAppBack(isManaging ? "/(tabs)" : "/onboarding/step4-destination");
  const { user } = useUserStore();

  const [universities, setUniversities] = useState<UniversityRecord[]>([]);
  const [existingJourneys, setExistingJourneys] = useState<UserJourneyWithUniversity[]>([]);
  const [selectedIds, setSelectedIdsState] = useState<string[]>([]);
  // Mirror of selectedIds so quick successive taps never act on a stale render.
  const selectedRef = useRef<string[]>([]);
  const setSelectedIds = useCallback((next: string[]) => {
    selectedRef.current = next;
    setSelectedIdsState(next);
  }, []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [profileFields, setProfileFields] = useState<{
    destination: string | null;
    origin: string | null;
    level: string | null;
    visaType: string | null;
  }>({ destination: null, origin: null, level: null, visaType: null });

  const destinationCode =
    profileFields.destination || user?.destinationCountry?.code || "";
  // Students pick universities for the level they are applying for next.
  const targetLevel = profileFields.level ? targetStudyLevel(profileFields.level) : null;

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        router.replace("/onboarding/step1-account");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("destination_country, country_origin, level_of_study, visa_type")
        .eq("id", authUser.id)
        .single();

      const destination = profile?.destination_country || user?.destinationCountry?.code || null;
      setProfileFields({
        destination,
        origin: profile?.country_origin || user?.homeCountry?.code || null,
        level: profile?.level_of_study || user?.educationBackground?.level || null,
        visaType: profile?.visa_type || null,
      });

      if (!destination) {
        if (isManaging) {
          setError("Set your destination country in your profile first.");
          return;
        }
        router.replace("/onboarding/step4-destination");
        return;
      }

      const [list, existing] = await Promise.all([
        fetchUniversitiesForCountry(destination),
        fetchUserJourneys(authUser.id),
      ]);

      const forDestination = existing.filter(
        (j) => j.destination_country_code.toUpperCase() === destination.toUpperCase(),
      );
      const currentLevel = profile?.level_of_study || user?.educationBackground?.level || null;
      const level = currentLevel ? targetStudyLevel(currentLevel) : null;
      // Keep already-chosen universities visible even if the catalog lists
      // them under another level.
      const chosenIds = new Set(forDestination.map((j) => j.university_id));
      setUniversities(list.filter((u) => chosenIds.has(u.id) || offersStudyLevel(u, level)));
      setExistingJourneys(forDestination);
      setSelectedIds(
        forDestination
          .map((j) => j.university_id)
          .filter((id): id is string => !!id && list.some((u) => u.id === id))
          .slice(0, MAX_SELECTION),
      );
    } catch (loadError) {
      console.error("Error loading universities:", loadError);
      setError("Failed to load universities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isManaging, router, setSelectedIds, user?.destinationCountry?.code, user?.homeCountry?.code, user?.educationBackground?.level]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    const current = selectedRef.current;
    if (current.includes(id)) {
      setError("");
      setSelectedIds(current.filter((selectedId) => selectedId !== id));
      return;
    }
    if (current.length >= MAX_SELECTION) {
      setError(`You can pick up to ${MAX_SELECTION} universities. Deselect one to swap.`);
      return;
    }
    setError("");
    setSelectedIds([...current, id]);
  };

  const visibleUniversities = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = universities.filter((university) => {
      if (needle) {
        const haystack = `${university.name} ${university.city || ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (scholarshipOnly) {
        const details = getUniversityLevelDetails(university, targetLevel);
        if (!details?.scholarshipAvailable) return false;
      }
      return true;
    });

    if (sortKey === "recommended") return filtered;

    const valueFor = (university: UniversityRecord): number | null => {
      if (sortKey === "ranking") return university.ranking_global ?? null;
      const details = getUniversityLevelDetails(university, targetLevel);
      if (sortKey === "tuition") return details?.tuitionMinUsd ?? details?.tuitionMaxUsd ?? null;
      const deadline = upcomingDeadline(details?.applicationDeadline);
      return deadline ? new Date(deadline).getTime() : null;
    };

    return [...filtered].sort((a, b) => {
      const av = valueFor(a);
      const bv = valueFor(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return av - bv;
    });
  }, [targetLevel, query, scholarshipOnly, sortKey, universities]);

  const goToNextStep = () => {
    if (isManaging) handleBack();
    else router.push("/onboarding/step5-visa");
  };

  const handleContinue = async () => {
    if (isProcessing) return;

    if (universities.length > 0 && selectedIds.length === 0) {
      setError("Pick at least one university to continue.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        router.replace("/onboarding/step1-account");
        return;
      }

      // Drop universities the user un-picked after coming back to this step,
      // and rows saved for a different level (they're re-created below).
      const deselected = existingJourneys.filter(
        (j) =>
          (j.university_id && !selectedIds.includes(j.university_id)) ||
          (!!targetLevel && j.education_level !== targetLevel),
      );
      await Promise.all(deselected.map((j) => deleteUserJourney(authUser.id, j.id)));

      const selectedUniversities = selectedIds
        .map((id) => universities.find((u) => u.id === id))
        .filter((u): u is UniversityRecord => !!u);

      if (selectedUniversities.length > 0 && profileFields.origin && targetLevel) {
        await upsertUserJourneys({
          userId: authUser.id,
          destinationCountryCode: destinationCode,
          originCountryCode: profileFields.origin,
          educationLevel: targetLevel,
          // The country-level visa (if already picked) is the fallback journey
          // until the university's own route has been generated.
          countryVisaType: profileFields.visaType,
          universities: selectedUniversities,
          makeFirstPrimary: true,
        });
        void requestMissingJourneyRoutes();
      }

      goToNextStep();
    } catch (saveError) {
      console.error("Error saving universities:", saveError);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <OnboardingProgressHeader hideProgress={isManaging} onBack={handleBack} progress={0.9} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={CORAL} size="large" />
          <Text style={styles.loadingText}>Finding universities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filtersActive = sortKey !== "recommended" || scholarshipOnly;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <OnboardingProgressHeader hideProgress={isManaging} onBack={handleBack} progress={0.9} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        <Text style={styles.title}>Choose your universities</Text>

        <View style={styles.stickyControls}>
          {universities.length > 0 ? (
            <>
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Search color={MUTED} size={17} strokeWidth={1.8} />
                  <TextInput
                    accessibilityLabel="Search universities"
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    onChangeText={setQuery}
                    placeholder="Search"
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="search"
                    style={styles.searchInput}
                    value={query}
                  />
                </View>
                <TouchableOpacity
                  accessibilityLabel="Sort and filter"
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  onPress={() => setIsFilterOpen(true)}
                  style={styles.filterButton}
                >
                  <ListFilter color={filtersActive ? CORAL : MUTED} size={24} strokeWidth={1.6} />
                  {filtersActive ? <View style={styles.filterDot} /> : null}
                </TouchableOpacity>
              </View>

              <View style={styles.selectionPill}>
                <Text style={styles.selectionPillText}>
                  Selected: {selectedIds.length} of {MAX_SELECTION}
                </Text>
              </View>
            </>
          ) : null}

          {error ? (
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {universities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <GraduationCap color="#94A3B8" size={26} strokeWidth={1.7} />
            </View>
            <Text style={styles.emptyTitle}>No universities yet</Text>
            <Text style={styles.emptyText}>
              We&apos;re still adding universities for{" "}
              {user?.destinationCountry?.name || "this country"}. You can continue and add them
              from your profile once they&apos;re ready.
            </Text>
          </View>
        ) : visibleUniversities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyText}>
              Try another name or city, or clear your filters.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isProcessing}
              onPress={goToNextStep}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Continue without choosing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleUniversities.map((university) => (
              <UniversityCard
                key={university.id}
                countryName={user?.destinationCountry?.name || null}
                disabled={isProcessing}
                educationLevel={targetLevel}
                expanded={expandedId === university.id}
                onPress={() => toggle(university.id)}
                onToggleDetails={() =>
                  setExpandedId((current) => (current === university.id ? null : university.id))
                }
                selected={selectedIds.includes(university.id)}
                university={university}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          fullWidth
          loading={isProcessing}
          onPress={handleContinue}
          style={styles.continueButton}
          testID="universities-continue"
          title={isManaging ? "Save" : "Continue"}
        />
      </View>

      <FilterSheet
        onClose={() => setIsFilterOpen(false)}
        onReset={() => {
          setSortKey("recommended");
          setScholarshipOnly(false);
        }}
        onScholarshipOnlyChange={setScholarshipOnly}
        onSortChange={setSortKey}
        scholarshipOnly={scholarshipOnly}
        sortKey={sortKey}
        visible={isFilterOpen}
      />
    </SafeAreaView>
  );
}

function UniversityCard({
  university,
  countryName,
  educationLevel,
  selected,
  expanded,
  disabled,
  onPress,
  onToggleDetails,
}: {
  university: UniversityRecord;
  countryName: string | null;
  educationLevel: string | null;
  selected: boolean;
  expanded: boolean;
  disabled: boolean;
  onPress: () => void;
  onToggleDetails: () => void;
}) {
  const details = getUniversityLevelDetails(university, educationLevel);
  // Campus photo, else the logo, else a placeholder; skip any that fail to load.
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const cardImage = [
    { uri: university.image_url, isPhoto: true },
    { uri: university.logo_url, isPhoto: false },
  ].find((candidate): candidate is { uri: string; isPhoto: boolean } =>
    !!candidate.uri && !failedImages.includes(candidate.uri),
  );
  const rankingBadge = formatRankingBadge(university.ranking_global);
  const tuition = formatTuitionRange(details);
  const deadline = formatDeadline(details?.applicationDeadline);
  const scholarship = details?.scholarshipAvailable;
  const location = [university.city, countryName]
    .filter(Boolean)
    .join(", ");
  const notes = university.metadata?.notes;
  const applicationSystem = university.metadata?.applicationSystem;
  const hasScholarship = scholarship !== undefined && scholarship !== null;
  const hasFacts = !!tuition || hasScholarship || !!deadline;
  const hasDetails = !!notes || !!applicationSystem || !!university.website;

  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      testID={`university-${university.slug}`}
    >
      <View style={styles.cardHeader}>
        {cardImage ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit={cardImage.isPhoto ? "cover" : "contain"}
            onError={() => setFailedImages((failed) => [...failed, cardImage.uri])}
            source={{ uri: cardImage.uri }}
            style={[styles.cardImage, !cardImage.isPhoto && styles.cardImageLogo]}
            transition={150}
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <GraduationCap color={CORAL} size={24} strokeWidth={1.7} />
          </View>
        )}
        <View style={styles.cardTitleBlock}>
          <Text numberOfLines={2} style={styles.cardTitle}>
            {university.name}
          </Text>
          {location ? (
            <Text numberOfLines={1} style={styles.cardLocation}>
              {location} {countryFlag(university.country_code)}
            </Text>
          ) : null}
        </View>
        <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
          {selected ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : null}
        </View>
      </View>

      {rankingBadge || university.tagline ? (
        <View style={styles.tagRow}>
          {rankingBadge ? (
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{rankingBadge}</Text>
            </View>
          ) : null}
          {university.tagline ? (
            <Text numberOfLines={1} style={styles.tagline}>
              {university.tagline}
            </Text>
          ) : null}
        </View>
      ) : null}

      {hasFacts || hasDetails ? <View style={styles.divider} /> : null}

      {tuition ? <FactRow label="Tuition" value={tuition} /> : null}
      {hasScholarship ? (
        <FactRow
          label="Scholarship"
          value={scholarship ? "Available" : "Limited"}
          valueStyle={scholarship ? styles.factValuePositive : styles.factValueMuted}
        />
      ) : null}
      {deadline ? <FactRow label="Deadline" value={deadline} /> : null}

      {expanded ? (
        <View style={styles.detailsBlock}>
          {notes ? <Text style={styles.detailsText}>{notes}</Text> : null}
          {applicationSystem ? (
            <Text style={styles.detailsText}>
              <Text style={styles.detailsLabel}>Apply via </Text>
              {applicationSystem}
            </Text>
          ) : null}
          {university.website ? (
            <Text
              onPress={() => Linking.openURL(university.website as string).catch(() => null)}
              style={styles.detailsLink}
            >
              Visit website
            </Text>
          ) : null}
        </View>
      ) : null}

      {hasDetails ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          onPress={onToggleDetails}
          style={styles.detailsButton}
        >
          <Text style={styles.detailsButtonText}>{expanded ? "Less" : "Details"}</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

function FactRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function FilterSheet({
  visible,
  sortKey,
  scholarshipOnly,
  onSortChange,
  onScholarshipOnlyChange,
  onReset,
  onClose,
}: {
  visible: boolean;
  sortKey: SortKey;
  scholarshipOnly: boolean;
  onSortChange: (key: SortKey) => void;
  onScholarshipOnlyChange: (value: boolean) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Close filters" onPress={onClose} style={styles.sheetBackdrop} />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Sort & filter</Text>
          <TouchableOpacity accessibilityLabel="Close" hitSlop={10} onPress={onClose}>
            <X color={TEXT} size={22} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sheetSection}>Sort by</Text>
        {SORT_OPTIONS.map((option) => {
          const active = option.key === sortKey;
          return (
            <TouchableOpacity
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              activeOpacity={0.7}
              onPress={() => onSortChange(option.key)}
              style={styles.sheetOption}
            >
              <Text style={[styles.sheetOptionText, active && styles.sheetOptionTextActive]}>
                {option.label}
              </Text>
              {active ? <Check color={CORAL} size={18} strokeWidth={2.4} /> : null}
            </TouchableOpacity>
          );
        })}

        <Text style={styles.sheetSection}>Filter</Text>
        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: scholarshipOnly }}
          activeOpacity={0.7}
          onPress={() => onScholarshipOnlyChange(!scholarshipOnly)}
          style={styles.sheetOption}
        >
          <Text style={[styles.sheetOptionText, scholarshipOnly && styles.sheetOptionTextActive]}>
            Scholarship available
          </Text>
          <View style={[styles.checkCircle, scholarshipOnly && styles.checkCircleSelected]}>
            {scholarshipOnly ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : null}
          </View>
        </TouchableOpacity>

        <View style={styles.sheetActions}>
          <TouchableOpacity activeOpacity={0.7} onPress={onReset} style={styles.sheetReset}>
            <Text style={styles.sheetResetText}>Reset</Text>
          </TouchableOpacity>
          <Button onPress={onClose} style={styles.sheetApply} title="Show results" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FAFBFC",
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 14,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  title: {
    color: "#1F2937",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  stickyControls: {
    backgroundColor: "#FAFBFC",
    paddingBottom: 12,
    paddingTop: 12,
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#A3A3A3",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 38,
    paddingHorizontal: 10,
  },
  searchInput: {
    color: TEXT,
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 36,
  },
  filterDot: {
    backgroundColor: CORAL,
    borderRadius: 4,
    height: 8,
    position: "absolute",
    right: 2,
    top: 6,
    width: 8,
  },
  selectionPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FFE8E8",
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  selectionPillText: {
    color: "#F05252",
    fontSize: 12,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#FFF1F2",
    borderRadius: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: "#BE123C",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardSelected: {
    borderColor: CORAL,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  cardImage: {
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  cardImageLogo: {
    backgroundColor: "#F8FAFC",
  },
  cardImagePlaceholder: {
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  cardLocation: {
    color: MUTED,
    fontSize: 13,
    marginTop: 2,
  },
  checkCircle: {
    alignItems: "center",
    borderColor: "#4B5563",
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  checkCircleSelected: {
    backgroundColor: CORAL,
    borderColor: CORAL,
  },
  tagRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  rankBadge: {
    backgroundColor: "#EAF1FF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rankBadgeText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
  },
  tagline: {
    color: "#4B5563",
    flex: 1,
    fontSize: 12,
  },
  divider: {
    backgroundColor: "#EEF0F3",
    height: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  factRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  factLabel: {
    color: MUTED,
    fontSize: 13,
  },
  factValue: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "600",
  },
  factValuePositive: {
    color: "#16A34A",
  },
  factValueMuted: {
    color: MUTED,
  },
  detailsBlock: {
    gap: 6,
    marginTop: 8,
  },
  detailsText: {
    color: "#374151",
    fontSize: 13,
    lineHeight: 18,
  },
  detailsLabel: {
    color: MUTED,
  },
  detailsLink: {
    color: CORAL,
    fontSize: 13,
    fontWeight: "600",
  },
  detailsButton: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  detailsButtonText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: BORDER,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    height: 48,
    justifyContent: "center",
    marginBottom: 14,
    width: 48,
  },
  emptyTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    textAlign: "center",
  },
  skipButton: {
    marginTop: 14,
    paddingVertical: 6,
  },
  skipText: {
    color: CORAL,
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    backgroundColor: "#FAFBFC",
    paddingBottom: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  continueButton: {
    borderRadius: 28,
    height: 56,
    shadowColor: CORAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  sheetBackdrop: {
    backgroundColor: "rgba(17,24,39,0.35)",
    flex: 1,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sheetTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
  },
  sheetSection: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginTop: 14,
    textTransform: "uppercase",
  },
  sheetOption: {
    alignItems: "center",
    borderBottomColor: "#F1F2F4",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  sheetOptionText: {
    color: "#374151",
    fontSize: 15,
  },
  sheetOptionTextActive: {
    color: TEXT,
    fontWeight: "600",
  },
  sheetActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingTop: 20,
  },
  sheetReset: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  sheetResetText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: "600",
  },
  sheetApply: {
    borderRadius: 28,
    flex: 1,
    height: 52,
  },
});
