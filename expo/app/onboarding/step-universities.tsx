import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { getCountries, supabase } from "@/lib/supabase";
import { Country } from "@/types/user";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import {
  countryFlag,
  deleteUserJourney,
  FREE_UNIVERSITY_LIMIT,
  universityLimitFor,
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
// Countries can list thousands of universities; render them a page at a time.
const PAGE = 40;

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
  const [visibleCount, setVisibleCount] = useState(PAGE);
  // Free plans follow FREE_UNIVERSITY_LIMIT universities in total, across
  // countries; this is how many more fit in the destination being browsed.
  const [maxSelection, setMaxSelection] = useState<number>(FREE_UNIVERSITY_LIMIT);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  // Destination being browsed. In manage mode students can switch to (and add
  // universities in) another country; null until the profile has loaded.
  const [country, setCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [journeyCountries, setJourneyCountries] = useState<Record<string, number>>({});
  const [profileFields, setProfileFields] = useState<{
    destination: string | null;
    origin: string | null;
    level: string | null;
    visaType: string | null;
  }>({ destination: null, origin: null, level: null, visaType: null });

  const destinationCode =
    country || profileFields.destination || user?.destinationCountry?.code || "";
  const destinationName =
    countries.find((c) => c.code.toUpperCase() === destinationCode.toUpperCase())?.name ||
    (destinationCode === user?.destinationCountry?.code ? user?.destinationCountry?.name : null) ||
    destinationCode;
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
        .select("destination_country, country_origin, level_of_study, visa_type, subscription_tier")
        .eq("id", authUser.id)
        .single();

      // From the journey screens, open on the country of the university the
      // student is currently viewing.
      const { journeys: storeJourneys, activeJourneyKey } = useJourneyStore.getState();
      const viewingCountry = isManaging
        ? (storeJourneys.find((j) => j.key === activeJourneyKey) || storeJourneys[0])?.destinationCountryCode
        : null;
      const destination =
        country || viewingCountry || profile?.destination_country || user?.destinationCountry?.code || null;
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

      if (!country) setCountry(destination.toUpperCase());

      const [list, existing] = await Promise.all([
        fetchUniversitiesForCountry(destination),
        fetchUserJourneys(authUser.id),
      ]);
      const perCountry: Record<string, number> = {};
      existing.forEach((j) => {
        const code = j.destination_country_code.toUpperCase();
        perCountry[code] = (perCountry[code] || 0) + 1;
      });
      setJourneyCountries(perCountry);

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
      const elsewhere = existing.length - forDestination.length;
      const limit = Math.max(0, universityLimitFor(profile?.subscription_tier) - elsewhere);
      setMaxSelection(limit);
      setSelectedIds(
        forDestination
          .map((j) => j.university_id)
          .filter((id): id is string => !!id && list.some((u) => u.id === id))
          .slice(0, Math.max(limit, forDestination.length)),
      );
    } catch (loadError) {
      console.error("Error loading universities:", loadError);
      setError("Failed to load universities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [country, isManaging, router, setSelectedIds, user?.destinationCountry?.code, user?.homeCountry?.code, user?.educationBackground?.level]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isManaging) return;
    getCountries()
      .then(({ destination }) => setCountries(destination))
      .catch((countriesError) => console.error("Error loading countries:", countriesError));
  }, [isManaging]);

  // Countries the student already applies to come first, then the rest A–Z.
  const countryOptions = useMemo(
    () =>
      [...countries].sort((a, b) => {
        const aCount = journeyCountries[a.code.toUpperCase()] || 0;
        const bCount = journeyCountries[b.code.toUpperCase()] || 0;
        if (!!aCount !== !!bCount) return aCount ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [countries, journeyCountries],
  );

  const switchCountry = (code: string) => {
    if (code.toUpperCase() === destinationCode.toUpperCase()) return;
    setQuery("");
    setError("");
    setSelectedIds([]);
    setCountry(code.toUpperCase());
  };

  const toggle = (id: string) => {
    const current = selectedRef.current;
    if (current.includes(id)) {
      setError("");
      setSelectedIds(current.filter((selectedId) => selectedId !== id));
      return;
    }
    if (current.length >= maxSelection) {
      Alert.alert(
        "Want more universities?",
        `Free plans follow up to ${FREE_UNIVERSITY_LIMIT} universities in total. Upgrade to Pro to compare as many as you like, or deselect one to swap.`,
        [
          { text: "Not now", style: "cancel" },
          { text: "See Pro", onPress: () => router.push("/premium" as any) },
        ],
      );
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

  useEffect(() => {
    setVisibleCount(PAGE);
  }, [destinationCode, query, scholarshipOnly, sortKey]);

  const shownUniversities = visibleUniversities.slice(0, visibleCount);
  const firstDirectoryIndex =
    sortKey === "recommended" && !query.trim()
      ? shownUniversities.findIndex((u, index) => !u.is_featured && index > 0)
      : -1;

  const goToNextStep = () => {
    if (isManaging) handleBack();
    else router.push("/onboarding/step5-visa");
  };

  const handleContinue = async () => {
    if (isProcessing) return;

    if (!isManaging && universities.length > 0 && selectedIds.length === 0) {
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
          {isManaging && countryOptions.length > 0 ? (
            <ScrollView
              horizontal
              contentContainerStyle={styles.countryChips}
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              style={styles.countryChipsScroll}
            >
              {countryOptions.map((option) => {
                const active = option.code.toUpperCase() === destinationCode.toUpperCase();
                const count = journeyCountries[option.code.toUpperCase()] || 0;
                return (
                  <TouchableOpacity
                    key={option.code}
                    accessibilityLabel={`${option.name}${count ? `, ${count} chosen` : ""}`}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    activeOpacity={0.8}
                    disabled={isProcessing}
                    onPress={() => switchCountry(option.code)}
                    style={[styles.countryChip, active && styles.countryChipActive]}
                  >
                    <Text style={styles.countryChipFlag}>{option.flag}</Text>
                    <Text style={[styles.countryChipText, active && styles.countryChipTextActive]}>
                      {option.name}
                    </Text>
                    {count ? (
                      <View style={[styles.countryChipCount, active && styles.countryChipCountActive]}>
                        <Text style={[styles.countryChipCountText, active && styles.countryChipCountTextActive]}>
                          {count}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
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
                  {Number.isFinite(maxSelection)
                    ? `Selected: ${selectedIds.length} of ${maxSelection}`
                    : `Selected: ${selectedIds.length}`}
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
              {destinationName || "this country"}. You can continue and add them
              from your profile once they&apos;re ready.
            </Text>
          </View>
        ) : visibleUniversities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyText}>
              Try another name or city, or clear your filters.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {shownUniversities.map((university, index) => (
              <React.Fragment key={university.id}>
                {index === firstDirectoryIndex ? (
                  <Text style={styles.listSectionLabel}>
                    All universities in {destinationName || "this country"} · {visibleUniversities.length}
                  </Text>
                ) : null}
                <UniversityCard
                  countryName={destinationName || null}
                  disabled={isProcessing}
                  educationLevel={targetLevel}
                  onOpenDetails={() => router.push(`/university/${university.id}?from=picker` as any)}
                  onPress={() => toggle(university.id)}
                  selected={selectedIds.includes(university.id)}
                  university={university}
                />
              </React.Fragment>
            ))}
            {visibleUniversities.length > shownUniversities.length ? (
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.7}
                onPress={() => setVisibleCount((count) => count + PAGE * 2)}
                style={styles.showMore}
              >
                <Text style={styles.showMoreText}>
                  Show more · {visibleUniversities.length - shownUniversities.length} left
                </Text>
              </TouchableOpacity>
            ) : null}
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
  disabled,
  onPress,
  onOpenDetails,
}: {
  university: UniversityRecord;
  countryName: string | null;
  educationLevel: string | null;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  onOpenDetails: () => void;
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
  const hasScholarship = scholarship !== undefined && scholarship !== null;
  const hasFacts = !!tuition || hasScholarship || !!deadline;

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

      {hasFacts ? <View style={styles.divider} /> : null}

      {tuition ? <FactRow label="Tuition" value={tuition} /> : null}
      {hasScholarship ? (
        <FactRow
          label="Scholarship"
          value={scholarship ? "Available" : "Limited"}
          valueStyle={scholarship ? styles.factValuePositive : styles.factValueMuted}
        />
      ) : null}
      {deadline ? <FactRow label="Deadline" value={deadline} /> : null}

      <TouchableOpacity
        accessibilityLabel={`View details for ${university.name}`}
        accessibilityRole="button"
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
        onPress={onOpenDetails}
        style={styles.detailsButton}
      >
        <Text style={styles.detailsButtonText}>View details</Text>
      </TouchableOpacity>
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
  countryChipsScroll: {
    marginBottom: 12,
    marginHorizontal: -24,
  },
  countryChips: {
    gap: 8,
    paddingHorizontal: 24,
  },
  countryChip: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countryChipActive: {
    backgroundColor: CORAL,
    borderColor: CORAL,
  },
  countryChipFlag: {
    fontSize: 15,
  },
  countryChipText: {
    color: TEXT,
    fontSize: 13.5,
    fontWeight: "600",
  },
  countryChipTextActive: {
    color: "#FFFFFF",
  },
  countryChipCount: {
    alignItems: "center",
    backgroundColor: "#FFE8E8",
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 5,
  },
  countryChipCountActive: {
    backgroundColor: "#FFFFFF",
  },
  countryChipCountText: {
    color: CORAL,
    fontSize: 11,
    fontWeight: "800",
  },
  countryChipCountTextActive: {
    color: CORAL,
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
  listSectionLabel: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
  showMore: {
    alignItems: "center",
    borderColor: BORDER,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
    paddingVertical: 12,
  },
  showMoreText: {
    color: CORAL,
    fontSize: 14,
    fontWeight: "700",
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
