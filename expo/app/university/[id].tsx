import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Check,
  CircleDashed,
  ExternalLink,
  GraduationCap,
  Languages,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react-native";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { supabase, loadUserDocuments } from "@/lib/supabase";
import { fetchProfileDetails, ProfileDetails } from "@/lib/profileDetails";
import { fetchJourneysWithProgress } from "@/lib/journeyProgress";
import { useJourneyStore } from "@/store/journeyStore";
import {
  addUniversityJourney,
  countryFlag,
  deleteUserJourney,
  fetchUniversity,
  fetchUserJourneys,
  formatDeadline,
  formatPortal,
  formatRankingBadge,
  formatTuitionRange,
  getUniversityLevelDetails,
  getUniversityLevelProfile,
  needsUniversityProfile,
  requestUniversityProfile,
  RequirementKey,
  targetStudyLevel,
  UniversityLevelDetails,
  UniversityLevelProfile,
  UniversityLimitError,
  UniversityRecord,
  UserJourneyWithUniversity,
} from "@/lib/journeyRoutes";

type TabKey = "overview" | "programs" | "admissions" | "costs";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "programs", label: "Programs" },
  { key: "admissions", label: "Admissions" },
  { key: "costs", label: "Costs & Scholarships" },
];

const LEVEL_LABEL: Record<string, string> = {
  bachelors: "Bachelor's",
  masters: "Master's",
  phd: "PhD",
  language: "Language course",
};

type Fit = {
  tone: "good" | "possible" | "reach" | "unknown";
  label: string;
  reason: string;
};

/** What the student has on file, for marking requirements they already meet. */
type Readiness = {
  documentCodes: Set<string>;
  profile: ProfileDetails | null;
};

/**
 * University details (Figma: "University details"): lets a student judge in
 * seconds whether a university is a good fit, then follow it.
 */
export default function UniversityDetailsScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  // Opened from the university picker: choosing happens there, so no actions here.
  const browseOnly = from === "picker";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = useAppBack("/(tabs)/premium");
  const setJourneys = useJourneyStore((state) => state.setJourneys);

  const [university, setUniversity] = useState<UniversityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [following, setFollowing] = useState<UserJourneyWithUniversity | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");
  const [readiness, setReadiness] = useState<Readiness>({
    documentCodes: new Set(),
    profile: null,
  });
  const [imageFailed, setImageFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const level = readiness.profile?.level_of_study ? targetStudyLevel(readiness.profile.level_of_study) : null;

  const loadFollowing = useCallback(async (universityId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const journeys = await fetchUserJourneys(user.id);
    setFollowing(journeys.find((j) => j.university_id === universityId) ?? null);
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const row = await fetchUniversity(id);
      if (!active) return;
      setUniversity(row);
      setLoading(false);
      if (!row) return;

      loadFollowing(row.id).catch(() => null);
      Promise.all([fetchProfileDetails().catch(() => null), loadUserDocuments().catch(() => [])]).then(
        ([profile, documents]) => {
          if (!active) return;
          const codes = new Set<string>();
          (
            documents as Array<{
              document_categories?: Array<{ code?: string }> | { code?: string };
            }>
          ).forEach((doc) => {
            const categories = Array.isArray(doc.document_categories)
              ? doc.document_categories
              : doc.document_categories
                ? [doc.document_categories]
                : [];
            categories.forEach((category) => category?.code && codes.add(category.code));
          });
          setReadiness({ documentCodes: codes, profile });
        },
      );

      // First visit: research the university once; everyone after gets the cache.
      if (needsUniversityProfile(row)) {
        setResearching(true);
        const refreshed = await requestUniversityProfile(row.id);
        if (!active) return;
        if (refreshed) setUniversity(refreshed);
        setResearching(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, loadFollowing]);

  const details = university ? getUniversityLevelDetails(university, level) : null;
  const levelProfile = university ? getUniversityLevelProfile(university, level) : null;
  const profile = university?.metadata?.profile ?? null;
  const fit = useMemo(
    () => computeFit(readiness.profile, details, levelProfile),
    [details, levelProfile, readiness.profile],
  );

  const refreshJourneyStore = useCallback(
    async (preferKey?: string | null) => {
      try {
        const result = await fetchJourneysWithProgress();
        setJourneys(result.journeys, preferKey);
      } catch (error) {
        console.warn("Could not refresh journeys:", error);
      }
    },
    [setJourneys],
  );

  const follow = useCallback(async () => {
    if (!university) return null;
    const journeyId = await addUniversityJourney(university);
    await loadFollowing(university.id);
    await refreshJourneyStore(journeyId);
    return journeyId;
  }, [loadFollowing, refreshJourneyStore, university]);

  const showAddError = (error: unknown, title: string) => {
    if (error instanceof UniversityLimitError) {
      Alert.alert("Want more universities?", error.message, [
        { text: "Not now", style: "cancel" },
        { text: "See Pro", onPress: () => router.push("/premium" as any) },
      ]);
      return;
    }
    Alert.alert(title, (error as Error).message);
  };

  const toggleSaved = async () => {
    if (!university || busy) return;
    Haptics.selectionAsync().catch(() => null);
    if (following) {
      Alert.alert(
        "Remove from My List?",
        `Your ${university.name} roadmap and its progress will be removed.`,
        [
          { text: "Keep", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              setBusy(true);
              try {
                await deleteUserJourney(following.user_id, following.id);
                setFollowing(null);
                await refreshJourneyStore();
              } catch (error) {
                Alert.alert("Couldn't remove", (error as Error).message);
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
      return;
    }
    setBusy(true);
    try {
      await follow();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    } catch (error) {
      showAddError(error, "Couldn't add university");
    } finally {
      setBusy(false);
    }
  };

  const startApplication = async () => {
    if (!university || busy) return;
    setBusy(true);
    try {
      const journeyId = following?.id ?? (await follow());
      if (journeyId) await refreshJourneyStore(journeyId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
      router.navigate("/(tabs)/journey" as any);
    } catch (error) {
      showAddError(error, "Couldn't start application");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={UI.primary} />
      </SafeAreaView>
    );
  }

  if (!university) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.missingTitle}>University not found</Text>
        <TouchableOpacity onPress={handleBack} style={styles.missingButton}>
          <Text style={styles.missingButtonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const rankingBadge = formatRankingBadge(university.ranking_global);
  const tuition = formatTuitionRange(details);
  const deadline = formatDeadline(details?.applicationDeadline);
  const languages = profile?.languages?.length ? profile.languages.join(", ") : null;
  const acceptance =
    profile?.acceptanceRate !== null && profile?.acceptanceRate !== undefined
      ? `${profile.acceptanceRate}%`
      : null;
  const notPublished = researching ? "Looking up…" : "Not published";

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={handleBack} style={styles.roundButton}>
          <ArrowLeft color={UI.text} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          University details
        </Text>
        {browseOnly ? (
          <View style={styles.saveButton} />
        ) : (
          <TouchableOpacity
            accessibilityLabel={following ? "Remove from My List" : "Save to My List"}
            accessibilityState={{ selected: !!following }}
            disabled={busy}
            onPress={toggleSaved}
            style={styles.saveButton}
          >
            {following ? (
              <BookmarkCheck color={UI.primary} fill={UI.primarySoft} size={22} strokeWidth={2} />
            ) : (
              <Bookmark color={UI.primary} size={22} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (browseOnly ? 40 : 120) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {university.image_url && !imageFailed ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="cover"
            onError={() => setImageFailed(true)}
            source={{ uri: university.image_url }}
            style={styles.heroImage}
            transition={200}
          />
        ) : (
          <View style={[styles.heroImage, styles.heroFallback]}>
            <GraduationCap color={UI.primary} size={44} strokeWidth={1.4} />
          </View>
        )}

        <View style={styles.identity}>
          <View style={styles.logoWrap}>
            {university.logo_url && !logoFailed ? (
              <Image
                contentFit="contain"
                onError={() => setLogoFailed(true)}
                source={{ uri: university.logo_url }}
                style={styles.logo}
              />
            ) : (
              <Text style={styles.logoInitials}>{initials(university.name)}</Text>
            )}
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{university.name}</Text>
            <Text style={styles.location}>
              {[university.city, countryName(university.country_code)].filter(Boolean).join(", ")}{" "}
              {countryFlag(university.country_code)}
            </Text>
          </View>
        </View>

        {rankingBadge || university.tagline ? (
          <View style={styles.badgeRow}>
            {rankingBadge ? (
              <View style={styles.rankBadge}>
                <Sparkles color={UI.warning} size={13} strokeWidth={2.4} />
                <Text style={styles.rankBadgeText}>{rankingBadge}</Text>
              </View>
            ) : null}
            {university.tagline ? (
              <View style={styles.tagline}>
                <Check color={UI.success} size={14} strokeWidth={3} />
                <Text numberOfLines={2} style={styles.taglineText}>
                  {university.tagline}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.statGrid}>
          <StatCard Icon={Wallet} label="Tuition" value={tuition ?? notPublished} />
          <StatCard Icon={Users} label="Acceptance rate" value={acceptance ?? notPublished} />
          <StatCard Icon={CalendarDays} label="Application Deadline" value={deadline ?? notPublished} />
          <StatCard Icon={Languages} label="Language requirements" value={languages ?? notPublished} />
        </View>

        <View style={styles.fitCard}>
          <View style={styles.fitHeader}>
            <Text style={styles.fitTitle}>Is it a good match?</Text>
            {fit.tone !== "unknown" ? (
              <View style={[styles.fitPill, { backgroundColor: FIT_COLORS[fit.tone].soft }]}>
                <Text style={[styles.fitPillText, { color: FIT_COLORS[fit.tone].text }]}>{fit.label}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.fitReason}>{fit.reason}</Text>
          {fit.tone === "unknown" ? (
            <TouchableOpacity onPress={() => router.push("/profile/edit" as any)} style={styles.fitLink}>
              <Text style={styles.fitLinkText}>Complete your profile</Text>
              <ArrowRight color={UI.primary} size={14} strokeWidth={2.4} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.tabs}
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroller}
        >
          {TABS.map((item) => {
            const active = item.key === tab;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  if (active) return;
                  Haptics.selectionAsync().catch(() => null);
                  setTab(item.key);
                }}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {researching && !profile ? (
          <View style={styles.researching}>
            <ActivityIndicator color={UI.primary} size="small" />
            <Text style={styles.researchingText}>Gathering the latest admissions details…</Text>
          </View>
        ) : null}

        {tab === "overview" ? (
          <OverviewTab profile={profile} university={university} />
        ) : tab === "programs" ? (
          <ProgramsTab level={level} levelProfile={levelProfile} researching={researching} />
        ) : tab === "admissions" ? (
          <AdmissionsTab
            details={details}
            levelProfile={levelProfile}
            readiness={readiness}
            researching={researching}
            university={university}
          />
        ) : (
          <CostsTab details={details} profile={profile} researching={researching} />
        )}
      </ScrollView>

      {browseOnly ? null : (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.88}
            disabled={busy}
            onPress={startApplication}
            style={[styles.footerButton, busy && styles.footerButtonBusy]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.footerButtonText}>
                  {following ? "Open my application tasks" : "Start Application"}
                </Text>
                <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.4} />
              </>
            )}
          </TouchableOpacity>
          {!following ? (
            <Text style={styles.footerHint}>Adds this university's roadmap to your Tasks</Text>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

function StatCard({ Icon, label, value }: { Icon: typeof Wallet; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statLabelRow}>
        <Icon color={UI.text} size={18} strokeWidth={1.9} />
        <Text numberOfLines={2} style={styles.statLabel}>
          {label}
        </Text>
      </View>
      <Text numberOfLines={2} style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Empty({ researching, text }: { researching: boolean; text: string }) {
  if (researching) return null;
  return <Text style={styles.emptyText}>{text}</Text>;
}

function OverviewTab({
  university,
  profile,
}: {
  university: UniversityRecord;
  profile: NonNullable<UniversityRecord["metadata"]>["profile"];
}) {
  const overview =
    profile?.overview || university.metadata?.notes?.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, "").trim() || null;
  const facts = [
    {
      label: "Students",
      value: profile?.studentCount ? profile.studentCount.toLocaleString() : null,
    },
    {
      label: "International",
      value:
        profile?.internationalPercent !== null && profile?.internationalPercent !== undefined
          ? `${profile.internationalPercent}%`
          : null,
    },
    {
      label: "World ranking",
      value:
        university.ranking_global && university.ranking_global <= 1000
          ? `#${university.ranking_global}`
          : null,
    },
  ].filter((fact) => fact.value);

  return (
    <>
      <Section title="About">
        {overview ? (
          <Text style={styles.body}>{overview}</Text>
        ) : (
          <Empty
            researching={false}
            text="We're still building this profile. Check the official website for now."
          />
        )}
      </Section>
      {facts.length ? (
        <View style={styles.factRow}>
          {facts.map((fact) => (
            <View key={fact.label} style={styles.fact}>
              <Text style={styles.factValue}>{fact.value}</Text>
              <Text style={styles.factLabel}>{fact.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {university.website ? (
        <TouchableOpacity
          accessibilityRole="link"
          onPress={() => Linking.openURL(university.website as string).catch(() => null)}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>Official website</Text>
          <ExternalLink color={UI.primary} size={16} strokeWidth={2.2} />
        </TouchableOpacity>
      ) : null}
    </>
  );
}

function ProgramsTab({
  level,
  levelProfile,
  researching,
}: {
  level: string | null;
  levelProfile: UniversityLevelProfile | null;
  researching: boolean;
}) {
  const programs = levelProfile?.programs ?? [];
  const intakes = levelProfile?.intakes ?? [];
  return (
    <>
      <Section title={`${level ? `${LEVEL_LABEL[level] ?? "Popular"} ` : ""}programs taught in English`}>
        {programs.length ? (
          <View style={styles.chips}>
            {programs.map((program) => (
              <View key={program} style={styles.chip}>
                <Text style={styles.chipText}>{program}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Empty researching={researching} text="No English-taught programs listed yet." />
        )}
      </Section>
      {intakes.length ? (
        <Section title="Intakes">
          <Text style={styles.body}>{intakes.join(" · ")}</Text>
        </Section>
      ) : null}
    </>
  );
}

const REQUIREMENT_DOCS: Partial<Record<RequirementKey, string[]>> = {
  passport: ["passport"],
  transcript: ["education"],
  diploma: ["education"],
  financial_proof: ["financial"],
};

function AdmissionsTab({
  university,
  details,
  levelProfile,
  readiness,
  researching,
}: {
  university: UniversityRecord;
  details: UniversityLevelDetails | null;
  levelProfile: UniversityLevelProfile | null;
  readiness: Readiness;
  researching: boolean;
}) {
  const requirements = levelProfile?.requirements ?? [];
  const portal = university.metadata?.profile?.applicationPortal || university.metadata?.applicationSystem;
  const english = englishStatus(readiness.profile, levelProfile);

  const isMet = (key: RequirementKey) => {
    if (key === "english_test") return english === "met";
    const docs = REQUIREMENT_DOCS[key];
    return !!docs?.some((code) => readiness.documentCodes.has(code));
  };
  const metCount = requirements.filter((r) => isMet(r.key)).length;

  return (
    <>
      <Section title="Requirements checklist">
        {requirements.length ? (
          <>
            <Text style={styles.checklistMeta}>
              You already meet {metCount} of {requirements.length}
            </Text>
            <View style={styles.checklist}>
              {requirements.map((requirement, index) => {
                const met = isMet(requirement.key);
                return (
                  <View
                    key={`${requirement.key}-${index}`}
                    style={[styles.requirement, index > 0 && styles.requirementDivider]}
                  >
                    <View style={[styles.requirementIcon, met && styles.requirementIconMet]}>
                      {met ? (
                        <Check color="#FFFFFF" size={13} strokeWidth={3} />
                      ) : (
                        <CircleDashed color={UI.muted} size={16} strokeWidth={2} />
                      )}
                    </View>
                    <View style={styles.requirementCopy}>
                      <Text style={[styles.requirementLabel, met && styles.requirementLabelMet]}>
                        {requirement.label}
                      </Text>
                      {requirement.detail ? (
                        <Text style={styles.requirementDetail}>{requirement.detail}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Empty researching={researching} text="Requirements haven't been published yet." />
        )}
      </Section>

      <Section title="Key dates & scores">
        <View style={styles.kvList}>
          <KeyValue label="Application deadline" value={formatDeadline(details?.applicationDeadline)} />
          <KeyValue
            label="Minimum IELTS"
            value={levelProfile?.minIelts ? String(levelProfile.minIelts) : null}
          />
          <KeyValue
            label="Minimum TOEFL iBT"
            value={levelProfile?.minToefl ? String(levelProfile.minToefl) : null}
          />
          <KeyValue
            label="Minimum grade"
            value={levelProfile?.minGpaPercent ? `${levelProfile.minGpaPercent}% of max` : null}
          />
          <KeyValue
            label="Apply through"
            onPress={
              portal && /^https?:\/\//.test(portal)
                ? () => Linking.openURL(portal).catch(() => null)
                : undefined
            }
            value={formatPortal(portal)}
          />
        </View>
      </Section>
    </>
  );
}

function CostsTab({
  details,
  profile,
  researching,
}: {
  details: UniversityLevelDetails | null;
  profile: NonNullable<UniversityRecord["metadata"]>["profile"];
  researching: boolean;
}) {
  const scholarships = profile?.scholarships ?? [];
  const living = profile?.monthlyLivingCostUsd;
  return (
    <>
      <Section title="Yearly costs">
        <View style={styles.kvList}>
          <KeyValue label="Tuition" value={formatTuitionRange(details)} />
          <KeyValue label="Living costs" value={living ? `≈ $${living.toLocaleString()} / month` : null} />
          <KeyValue
            label="Scholarships for internationals"
            value={
              details?.scholarshipAvailable === true
                ? "Available"
                : details?.scholarshipAvailable === false
                  ? "Limited"
                  : null
            }
          />
        </View>
      </Section>
      <Section title="Scholarships & fee waivers">
        {scholarships.length ? (
          <View style={styles.checklist}>
            {scholarships.map((name, index) => (
              <View key={name} style={[styles.requirement, index > 0 && styles.requirementDivider]}>
                <View style={[styles.requirementIcon, styles.scholarshipIcon]}>
                  <Sparkles color={UI.warning} size={13} strokeWidth={2.4} />
                </View>
                <Text style={[styles.requirementLabel, styles.requirementCopy]}>{name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Empty
            researching={researching}
            text="No named scholarships listed. Ask the admissions office about fee waivers."
          />
        )}
      </Section>
    </>
  );
}

function KeyValue({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string | null | undefined;
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text
        numberOfLines={2}
        style={[styles.kvValue, !value && styles.kvValueMuted, onPress && styles.kvValueLink]}
      >
        {value || "Not published"}
      </Text>
    </Pressable>
  );
}

const FIT_COLORS = {
  good: { soft: UI.successSoft, text: "#139C8F" },
  possible: { soft: UI.warningSoft, text: "#B7791F" },
  reach: { soft: UI.primarySoft, text: UI.primary },
  unknown: { soft: UI.hairline, text: UI.muted },
} as const;

function englishStatus(
  profile: ProfileDetails | null,
  levelProfile: UniversityLevelProfile | null,
): "met" | "below" | "unknown" {
  if (!profile?.test_scores?.length) return "unknown";
  const score = (type: RegExp) => {
    const entry = profile.test_scores.find((t) => type.test(t.type));
    const value = entry ? Number.parseFloat(entry.score) : NaN;
    return Number.isFinite(value) ? value : null;
  };
  const ielts = score(/ielts/i);
  const toefl = score(/toefl/i);
  if (levelProfile?.minIelts && ielts !== null) return ielts >= levelProfile.minIelts ? "met" : "below";
  if (levelProfile?.minToefl && toefl !== null) return toefl >= levelProfile.minToefl ? "met" : "below";
  if ((ielts !== null || toefl !== null) && !levelProfile?.minIelts && !levelProfile?.minToefl) return "met";
  return "unknown";
}

/** Simple, explainable match from budget, grades and English scores. */
function computeFit(
  profile: ProfileDetails | null,
  details: UniversityLevelDetails | null,
  levelProfile: UniversityLevelProfile | null,
): Fit {
  if (!profile) {
    return {
      tone: "unknown",
      label: "",
      reason: "Check teaching language and complete your profile to find out.",
    };
  }
  const met: string[] = [];
  const missed: string[] = [];

  const tuitionMin = details?.tuitionMinUsd ?? null;
  if (profile.budget_max && tuitionMin !== null) {
    (tuitionMin <= profile.budget_max ? met : missed).push(
      tuitionMin <= profile.budget_max ? "tuition fits your budget" : "tuition is above your budget",
    );
  }

  if (profile.gpa && profile.gpa_scale && levelProfile?.minGpaPercent) {
    const percent = (profile.gpa / profile.gpa_scale) * 100;
    (percent >= levelProfile.minGpaPercent ? met : missed).push(
      percent >= levelProfile.minGpaPercent
        ? "your grades meet the minimum"
        : "your grades are below the usual minimum",
    );
  }

  const english = englishStatus(profile, levelProfile);
  if (english === "met") met.push("your English score qualifies");
  if (english === "below") missed.push("your English score is below the minimum");

  const majors = profile.intended_majors ?? [];
  const programs = levelProfile?.programs ?? [];
  if (majors.length && programs.length) {
    const matches = majors.some((major) =>
      programs.some((program) => program.toLowerCase().includes(major.toLowerCase().split(" ")[0])),
    );
    (matches ? met : missed).push(
      matches ? "it teaches what you want to study" : "your intended major isn't listed",
    );
  }

  if (met.length + missed.length === 0) {
    return {
      tone: "unknown",
      label: "",
      reason: "Add your grades, test scores and budget to your profile to see how you compare.",
    };
  }
  const sentence = (items: string[]) => items.join(", ").replace(/^./, (c) => c.toUpperCase());
  if (missed.length === 0) return { tone: "good", label: "Good match", reason: `${sentence(met)}.` };
  if (missed.length === 1 && met.length > 0) {
    return {
      tone: "possible",
      label: "Possible match",
      reason: `${sentence(met)}, but ${missed[0]}.`,
    };
  }
  return { tone: "reach", label: "Reach", reason: `${sentence(missed)}.` };
}

function initials(name: string) {
  return (
    name
      .replace(/^the\s+/i, "")
      .split(/\s+/)
      .filter((word) => /^[A-Z]/.test(word))
      .slice(0, 2)
      .map((word) => word[0])
      .join("") || name.slice(0, 2).toUpperCase()
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  AU: "Australia",
  AT: "Austria",
  NE: "Netherlands",
  UAE: "United Arab Emirates",
  AM: "Armenia",
  FI: "Finland",
  AL: "Albania",
  HU: "Hungary",
  PH: "Philippines",
  GH: "Ghana",
  TR: "Türkiye",
  ID: "Indonesia",
  EG: "Egypt",
  BR: "Brazil",
  NG: "Nigeria",
  CA: "Canada",
  GE: "Georgia",
  DE: "Germany",
  GB: "United Kingdom",
  FR: "France",
  GR: "Greece",
  HK: "Hong Kong",
  US: "United States",
};

function countryName(code: string) {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  missingTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  missingButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  missingButtonText: {
    color: UI.primary,
    fontSize: 15,
    fontWeight: "700",
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
  saveButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  content: {
    paddingHorizontal: GUTTER,
    paddingTop: 4,
  },
  heroImage: {
    backgroundColor: UI.primaryRing,
    borderRadius: RADIUS.card,
    height: 190,
    width: "100%",
  },
  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
  },
  logoWrap: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: 34,
    borderWidth: 1,
    height: 68,
    justifyContent: "center",
    overflow: "hidden",
    width: 68,
  },
  logo: {
    height: 52,
    width: 52,
  },
  logoInitials: {
    color: UI.primary,
    fontSize: 20,
    fontWeight: "800",
  },
  identityCopy: {
    flex: 1,
  },
  name: {
    color: UI.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 27,
  },
  location: {
    color: UI.textSecondary,
    fontSize: 14,
    marginTop: 3,
  },
  badgeRow: {
    gap: 8,
    marginTop: 12,
  },
  rankBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: UI.warningSoft,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rankBadgeText: {
    color: "#B7791F",
    fontSize: 12,
    fontWeight: "700",
  },
  tagline: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  taglineText: {
    color: UI.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  statCard: {
    backgroundColor: UI.card,
    borderColor: "#FFB3B3",
    borderRadius: RADIUS.tile,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 92,
    padding: 14,
  },
  statLabelRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  statLabel: {
    color: UI.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  statValue: {
    color: UI.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  fitCard: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    marginTop: 14,
    padding: 16,
    ...CARD_SHADOW,
  },
  fitHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fitTitle: {
    color: UI.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  fitPill: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  fitPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  fitReason: {
    color: UI.textSecondary,
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 6,
  },
  fitLink: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    marginTop: 10,
  },
  fitLinkText: {
    color: UI.primary,
    fontSize: 13.5,
    fontWeight: "700",
  },
  tabsScroller: {
    marginHorizontal: -GUTTER,
    marginTop: 22,
  },
  tabs: {
    gap: 8,
    paddingHorizontal: GUTTER,
  },
  tab: {
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  tabActive: {
    backgroundColor: UI.primary,
    borderColor: UI.primary,
  },
  tabText: {
    color: UI.text,
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  researching: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  researchingText: {
    color: UI.muted,
    fontSize: 13.5,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  body: {
    color: UI.textSecondary,
    fontSize: 14.5,
    lineHeight: 21,
  },
  emptyText: {
    color: UI.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  factRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  fact: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.tile,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...CARD_SHADOW,
  },
  factValue: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "800",
  },
  factLabel: {
    color: UI.muted,
    fontSize: 12,
    marginTop: 2,
  },
  linkRow: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
    paddingVertical: 4,
  },
  linkText: {
    color: UI.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    color: UI.text,
    fontSize: 13.5,
  },
  checklistMeta: {
    color: UI.muted,
    fontSize: 13,
    marginBottom: 10,
    marginTop: -4,
  },
  checklist: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    ...CARD_SHADOW,
  },
  requirement: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 13,
  },
  requirementDivider: {
    borderTopColor: UI.hairline,
    borderTopWidth: 1,
  },
  requirementIcon: {
    alignItems: "center",
    backgroundColor: UI.hairline,
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  requirementIconMet: {
    backgroundColor: UI.success,
  },
  scholarshipIcon: {
    backgroundColor: UI.warningSoft,
  },
  requirementCopy: {
    flex: 1,
  },
  requirementLabel: {
    color: UI.text,
    fontSize: 14.5,
    fontWeight: "600",
    lineHeight: 20,
  },
  requirementLabelMet: {
    color: UI.textSecondary,
  },
  requirementDetail: {
    color: UI.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  kvList: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    ...CARD_SHADOW,
  },
  kvRow: {
    alignItems: "center",
    borderBottomColor: UI.hairline,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  kvLabel: {
    color: UI.textSecondary,
    flexShrink: 0,
    fontSize: 14,
  },
  kvValue: {
    color: UI.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  kvValueLink: {
    color: UI.primary,
  },
  kvValueMuted: {
    color: UI.muted,
    fontWeight: "400",
  },
  footer: {
    backgroundColor: UI.background,
    borderTopColor: UI.hairline,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: GUTTER,
    paddingTop: 12,
    position: "absolute",
    right: 0,
  },
  footerButton: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 28,
    flexDirection: "row",
    gap: 8,
    height: 54,
    justifyContent: "center",
    shadowColor: UI.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  footerButtonBusy: {
    opacity: 0.8,
  },
  footerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footerHint: {
    color: UI.muted,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
