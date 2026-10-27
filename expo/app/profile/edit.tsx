import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardTypeOptions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  ClipboardCheck,
  Flag,
  Globe,
  GraduationCap,
  Home,
  Mail,
  MapPin,
  Phone,
  Plane,
  Plus,
  School,
  Search,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react-native";
import BottomSheet from "@/components/ui/BottomSheet";
import CalendarPicker, { toIsoDate } from "@/components/ui/CalendarPicker";
import ProgressRing from "@/components/ui/ProgressRing";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { syncJourneyRoutes } from "@/lib/journeyRoutes";
import {
  BUDGET_OPTIONS,
  budgetLabel,
  degreeLabelForLevel,
  DEGREE_OPTIONS,
  deleteAvatarFile,
  fetchProfileDetails,
  GPA_SCALES,
  MAJOR_SUGGESTIONS,
  ProfileDetails,
  profileCompletion,
  saveProfileDetails,
  TEST_TYPES,
  TestScore,
  upcomingIntakes,
  uploadAvatar,
} from "@/lib/profileDetails";
import { getCountries, supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { Country } from "@/types/user";

type FieldKey =
  | "full_name"
  | "date_of_birth"
  | "nationality"
  | "current_city"
  | "email"
  | "phone"
  | "country_origin"
  | "current_school"
  | "graduation_year"
  | "gpa"
  | "test_scores"
  | "level_of_study"
  | "intended_majors"
  | "destination_country"
  | "target_countries"
  | "budget"
  | "intake_term";

type Row = { key: FieldKey; label: string; Icon: typeof User };

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: "Personal Info",
    rows: [
      { key: "full_name", label: "Full name", Icon: User },
      { key: "date_of_birth", label: "Date of birth", Icon: Calendar },
      { key: "nationality", label: "Nationality", Icon: Flag },
      { key: "current_city", label: "Current city", Icon: MapPin },
      { key: "country_origin", label: "Home country", Icon: Home },
      { key: "email", label: "Email", Icon: Mail },
      { key: "phone", label: "Phone number", Icon: Phone },
    ],
  },
  {
    title: "Academic Profile",
    rows: [
      { key: "current_school", label: "Current school", Icon: School },
      { key: "graduation_year", label: "Graduation year", Icon: CalendarCheck },
      { key: "gpa", label: "GPA", Icon: Award },
      { key: "test_scores", label: "Test scores", Icon: ClipboardCheck },
    ],
  },
  {
    title: "Study Preferences",
    rows: [
      { key: "level_of_study", label: "Degree level", Icon: GraduationCap },
      { key: "intended_majors", label: "Intended majors", Icon: BookOpen },
      { key: "destination_country", label: "Main destination", Icon: Plane },
      { key: "target_countries", label: "Also considering", Icon: Globe },
      { key: "budget", label: "Budget range", Icon: Wallet },
      { key: "intake_term", label: "Intake term", Icon: CalendarClock },
    ],
  },
];

const COMPLETION_TO_FIELD: Record<string, FieldKey> = { budget: "budget" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const isEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export default function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const handleBack = useAppBack("/(tabs)/profile");
  const { user, updateUser } = useUserStore();
  const { confirmDeleteAccount, isDeletingAccount } = useDeleteAccount();

  const [original, setOriginal] = useState<ProfileDetails | null>(null);
  const [draft, setDraft] = useState<ProfileDetails | null>(null);
  const [origins, setOrigins] = useState<Country[]>([]);
  const [destinations, setDestinations] = useState<Country[]>([]);
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const leavingRef = useRef(false);

  useEffect(() => {
    Promise.all([fetchProfileDetails(), getCountries()])
      .then(([profile, countries]) => {
        setOriginal(profile);
        setDraft(profile);
        setOrigins(countries.origin);
        setDestinations(countries.destination);
      })
      .catch((error) => {
        console.error("Error loading profile:", error);
        setLoadError("We couldn't load your profile. Please go back and try again.");
      });
  }, []);

  const dirty = !!draft && !!original && !isEqual(draft, original);

  // "Unsaved changes" prompt when leaving with edits.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event: any) => {
      if (!dirty || leavingRef.current) return;
      event.preventDefault();
      Alert.alert("Unsaved changes", "You have changes that haven't been saved.", [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            leavingRef.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [dirty, navigation]);

  const allCountries = useMemo(() => {
    const map = new Map<string, Country>();
    [...origins, ...destinations].forEach((country) => map.set(country.code.toUpperCase(), country));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [destinations, origins]);

  const countryName = useCallback(
    (code: string | null) => {
      if (!code) return null;
      const country = allCountries.find((c) => c.code.toUpperCase() === code.toUpperCase());
      return country ? `${country.flag} ${country.name}` : code;
    },
    [allCountries],
  );

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <Header dirty={false} onBack={handleBack} onSave={() => null} saving={false} />
        <Text style={styles.loadError}>{loadError}</Text>
      </SafeAreaView>
    );
  }

  if (!draft || !original) {
    return (
      <SafeAreaView style={styles.container}>
        <Header dirty={false} onBack={handleBack} onSave={() => null} saving={false} />
        <ActivityIndicator color={UI.primary} style={styles.loading} />
      </SafeAreaView>
    );
  }

  const completion = profileCompletion(draft);

  const valueFor = (key: FieldKey): string | null => {
    switch (key) {
      case "date_of_birth":
        return formatDate(draft.date_of_birth);
      case "nationality":
        return countryName(draft.nationality);
      case "country_origin":
        return countryName(draft.country_origin);
      case "destination_country":
        return countryName(draft.destination_country);
      case "target_countries":
        return draft.target_countries.map((code) => countryName(code)).join(", ") || null;
      case "graduation_year":
        return draft.graduation_year ? String(draft.graduation_year) : null;
      case "gpa":
        return draft.gpa !== null ? `${draft.gpa} / ${draft.gpa_scale ?? 4} scale` : null;
      case "test_scores":
        return draft.test_scores.map((t) => `${t.type} ${t.score}`).join(" · ") || null;
      case "level_of_study":
        return degreeLabelForLevel(draft.level_of_study);
      case "intended_majors":
        return draft.intended_majors.join(", ") || null;
      case "budget":
        return budgetLabel(draft.budget_min, draft.budget_max);
      default:
        return (draft[key] as string | null) || null;
    }
  };

  const apply = (patch: Partial<ProfileDetails>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setEditing(null);
  };

  // ---------------------------------------------------------------------
  // avatar
  // ---------------------------------------------------------------------

  const changeAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos access needed", "Allow photo access in Settings to choose a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setAvatarBusy(true);
    try {
      const asset = result.assets[0];
      const url = await uploadAvatar(asset.uri, asset.mimeType ?? "image/jpeg");
      await saveProfileDetails({ avatar_url: url });
      await deleteAvatarFile(original.avatar_url);
      setOriginal((current) => (current ? { ...current, avatar_url: url } : current));
      setDraft((current) => (current ? { ...current, avatar_url: url } : current));
      updateUser({ avatar: url });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    } catch (error) {
      console.error("Avatar upload failed:", error);
      Alert.alert("Upload failed", "We couldn't update your photo. Please try again.");
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = () => {
    Alert.alert("Remove photo", "Your initials will be shown instead.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setAvatarBusy(true);
          try {
            await saveProfileDetails({ avatar_url: null });
            await deleteAvatarFile(original.avatar_url);
            setOriginal((current) => (current ? { ...current, avatar_url: null } : current));
            setDraft((current) => (current ? { ...current, avatar_url: null } : current));
            updateUser({ avatar: undefined });
          } catch (error) {
            console.error("Avatar removal failed:", error);
            Alert.alert("Couldn't remove photo", "Please try again.");
          } finally {
            setAvatarBusy(false);
          }
        },
      },
    ]);
  };

  // ---------------------------------------------------------------------
  // save
  // ---------------------------------------------------------------------

  const save = async () => {
    if (!dirty || saving) return;
    const patch = Object.fromEntries(
      Object.entries(draft).filter(([key, value]) => !isEqual(value, original[key as keyof ProfileDetails])),
    ) as Partial<ProfileDetails>;

    const destinationChanged = "destination_country" in patch;
    const homeChanged = "country_origin" in patch;
    if (destinationChanged || homeChanged) {
      // The visa type depends on both countries; the student re-picks it next.
      (patch as Record<string, unknown>).visa_type = null;
    }

    setSaving(true);
    try {
      await saveProfileDetails(patch);
      if (homeChanged || "level_of_study" in patch) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          await syncJourneyRoutes(authUser.id, {
            originCountryCode: draft.country_origin,
            currentLevel: draft.level_of_study,
          });
        }
      }

      const home = allCountries.find((c) => c.code.toUpperCase() === draft.country_origin?.toUpperCase());
      const destination = allCountries.find(
        (c) => c.code.toUpperCase() === draft.destination_country?.toUpperCase(),
      );
      if (user) {
        updateUser({
          name: draft.full_name,
          email: draft.email,
          homeCountry: home || user.homeCountry,
          destinationCountry: destination || user.destinationCountry,
          educationBackground: {
            ...user.educationBackground,
            level: draft.level_of_study || user.educationBackground?.level,
          },
        });
      }

      setOriginal(draft);
      leavingRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);

      if ((destinationChanged || homeChanged) && destination) {
        router.push({
          pathname: "/onboarding/step5-visa",
          params: {
            pendingCountryCode: destination.code,
            pendingCountryName: destination.name,
            pendingCountryFlag: destination.flag || "",
            pendingHomeCountryCode: home?.code || "",
            pendingHomeCountryName: home?.name || "",
            pendingHomeCountryFlag: home?.flag || "",
            fromEditProfile: "true",
          },
        });
        return;
      }
      handleBack();
    } catch (error) {
      console.error("Error saving profile:", error);
      leavingRef.current = false;
      Alert.alert("Couldn't save", "There was an issue updating your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------

  const initials = (draft.full_name || user?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const statusLine = draft.intake_term
    ? `Applying for ${draft.intake_term}`
    : degreeLabelForLevel(draft.level_of_study)
      ? `Planning a ${degreeLabelForLevel(draft.level_of_study)}`
      : "Tell us when you plan to start";

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Header dirty={dirty} onBack={handleBack} onSave={save} saving={saving} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {draft.avatar_url ? (
              <Image contentFit="cover" source={{ uri: draft.avatar_url }} style={styles.avatarImage} transition={150} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
            {avatarBusy ? (
              <View style={styles.avatarBusy}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : null}
          </View>
          <View style={styles.profileCopy}>
            <Text numberOfLines={1} style={styles.profileName}>
              {draft.full_name || "Your name"}
            </Text>
            <Text numberOfLines={1} style={styles.profileStatus}>
              {statusLine}
            </Text>
            <View style={styles.avatarActions}>
              <TouchableOpacity disabled={avatarBusy} hitSlop={8} onPress={changeAvatar}>
                <Text style={styles.avatarChange}>Change profile picture</Text>
              </TouchableOpacity>
              {draft.avatar_url ? (
                <TouchableOpacity disabled={avatarBusy} hitSlop={8} onPress={removeAvatar}>
                  <Text style={styles.avatarRemove}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!completion.next}
          onPress={() =>
            completion.next &&
            setEditing(COMPLETION_TO_FIELD[completion.next.key] ?? (completion.next.key as FieldKey))
          }
          style={styles.completionCard}
        >
          <ProgressRing labelSize={15} progress={completion.percent} size={58} />
          <View style={styles.completionCopy}>
            <View style={styles.completionTitleRow}>
              <Text style={styles.completionTitle}>Profile {completion.percent}% complete</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  {completion.filled} of {completion.total}
                </Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${completion.percent}%` }]} />
            </View>
            <Text numberOfLines={1} style={styles.completionNext}>
              {completion.next ? (
                <>
                  Next: <Text style={styles.completionNextField}>Add your {completion.next.label.toLowerCase()}</Text>
                </>
              ) : (
                "Your profile is complete. Nice!"
              )}
            </Text>
          </View>
        </Pressable>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                {section.title}
              </Text>
              <TouchableOpacity
                hitSlop={10}
                onPress={() =>
                  setEditing(section.rows.find((row) => !valueFor(row.key))?.key ?? section.rows[0].key)
                }
              >
                <Text style={styles.sectionEdit}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {section.rows.map((row, index) => {
                const value = valueFor(row.key);
                const changed = !isEqual(fieldValue(draft, row.key), fieldValue(original, row.key));
                return (
                  <Pressable
                    key={row.key}
                    accessibilityHint="Edit"
                    accessibilityLabel={`${row.label}: ${value ?? "not set"}`}
                    accessibilityRole="button"
                    onPress={() => setEditing(row.key)}
                    style={({ pressed }) => [
                      styles.row,
                      index < section.rows.length - 1 && styles.rowDivider,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <row.Icon color="#7A7A8C" size={20} strokeWidth={1.7} />
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowLabel}>
                        {row.label}
                        {changed ? <Text style={styles.rowChanged}>  · edited</Text> : null}
                      </Text>
                      <Text numberOfLines={2} style={[styles.rowValue, !value && styles.rowPlaceholder]}>
                        {value ?? "Add"}
                      </Text>
                    </View>
                    <ArrowRight color="#7A7A8C" size={18} strokeWidth={1.8} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Account & Privacy
            </Text>
          </View>
          <View style={styles.card}>
            <Pressable onPress={() => router.push("/settings")} style={[styles.row, styles.rowDivider]}>
              <Bell color="#7A7A8C" size={20} strokeWidth={1.7} />
              <View style={styles.rowCopy}>
                <Text style={styles.rowValue}>Notifications & privacy</Text>
                <Text style={styles.rowLabel}>Password, notifications and app settings</Text>
              </View>
              <ArrowRight color="#7A7A8C" size={18} strokeWidth={1.8} />
            </Pressable>
            <Pressable disabled={isDeletingAccount} onPress={confirmDeleteAccount} style={styles.row}>
              <Trash2 color={UI.danger} size={20} strokeWidth={1.7} />
              <View style={styles.rowCopy}>
                <Text style={[styles.rowValue, styles.danger]}>Delete account</Text>
                <Text style={styles.rowLabel}>Permanently remove your account and data</Text>
              </View>
              {isDeletingAccount ? <ActivityIndicator color={UI.danger} /> : null}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <FieldEditor
        countries={{ all: allCountries, origins, destinations }}
        draft={draft}
        field={editing}
        onApply={apply}
        onClose={() => setEditing(null)}
      />
    </SafeAreaView>
  );
}

const fieldValue = (profile: ProfileDetails, key: FieldKey) =>
  key === "budget"
    ? [profile.budget_min, profile.budget_max]
    : key === "gpa"
      ? [profile.gpa, profile.gpa_scale]
      : profile[key as keyof ProfileDetails];

function Header({
  dirty,
  saving,
  onBack,
  onSave,
}: {
  dirty: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Go back" hitSlop={8} onPress={onBack} style={styles.backButton}>
        <ArrowLeft color={UI.text} size={20} strokeWidth={2.2} />
      </TouchableOpacity>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        Edit Profile
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: !dirty || saving }}
        disabled={!dirty || saving}
        onPress={onSave}
        style={[styles.saveButton, (!dirty || saving) && styles.saveButtonDisabled]}
      >
        {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveText}>Save</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// field editor
// ---------------------------------------------------------------------------

const TITLES: Record<FieldKey, string> = {
  full_name: "Full name",
  date_of_birth: "Date of birth",
  nationality: "Nationality",
  current_city: "Current city",
  email: "Email",
  phone: "Phone number",
  country_origin: "Home country",
  current_school: "Current school",
  graduation_year: "Graduation year",
  gpa: "GPA",
  test_scores: "Test scores",
  level_of_study: "Degree level",
  intended_majors: "Intended majors",
  destination_country: "Main destination",
  target_countries: "Also considering",
  budget: "Budget range",
  intake_term: "Intake term",
};

function FieldEditor({
  field: requestedField,
  draft,
  countries,
  onApply,
  onClose,
}: {
  field: FieldKey | null;
  draft: ProfileDetails;
  countries: { all: Country[]; origins: Country[]; destinations: Country[] };
  onApply: (patch: Partial<ProfileDetails>) => void;
  onClose: () => void;
}) {
  // Keep rendering the last field while the sheet animates closed.
  const [field, setField] = useState<FieldKey | null>(requestedField);
  useEffect(() => {
    if (requestedField) setField(requestedField);
  }, [requestedField]);

  // Local working copy so Cancel discards.
  const [text, setText] = useState("");
  const [secondary, setSecondary] = useState("");
  const [dateValue, setDateValue] = useState<string | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [scale, setScale] = useState(4);
  const [scores, setScores] = useState<TestScore[]>([]);
  const [testType, setTestType] = useState(TEST_TYPES[0]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const field = requestedField;
    if (!field) return;
    setError("");
    setQuery("");
    setSecondary("");
    setText(
      field === "full_name" || field === "current_city" || field === "email" || field === "phone" || field === "current_school"
        ? ((draft[field] as string | null) ?? "")
        : field === "gpa"
          ? draft.gpa !== null
            ? String(draft.gpa)
            : ""
          : "",
    );
    setScale(draft.gpa_scale ?? 4);
    setDateValue(draft.date_of_birth);
    setScores(draft.test_scores);
    setSelection(
      field === "intended_majors"
        ? draft.intended_majors
        : field === "target_countries"
          ? draft.target_countries
          : field === "nationality" || field === "country_origin" || field === "destination_country"
            ? draft[field]
              ? [draft[field] as string]
              : []
            : field === "graduation_year"
              ? draft.graduation_year
                ? [String(draft.graduation_year)]
                : []
              : field === "level_of_study"
                ? draft.level_of_study
                  ? [draft.level_of_study]
                  : []
                : field === "intake_term"
                  ? draft.intake_term
                    ? [draft.intake_term]
                    : []
                  : field === "budget"
                    ? [`${draft.budget_min}-${draft.budget_max}`]
                    : [],
    );
    // Only reset when a sheet opens, not when the draft changes underneath it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedField]);

  if (!field) return null;

  const done = () => {
    switch (field) {
      case "full_name":
        if (!text.trim()) return setError("Please enter your name.");
        return onApply({ full_name: text.trim() });
      case "email":
        if (!EMAIL_RE.test(text.trim())) return setError("Enter a valid email address.");
        return onApply({ email: text.trim() });
      case "phone":
        if (text.trim() && !PHONE_RE.test(text.trim())) return setError("Enter a valid phone number, e.g. +995 555 555 555.");
        return onApply({ phone: text.trim() || null });
      case "current_city":
      case "current_school":
        return onApply({ [field]: text.trim() || null });
      case "date_of_birth":
        return onApply({ date_of_birth: dateValue });
      case "gpa": {
        if (!text.trim()) return onApply({ gpa: null, gpa_scale: null });
        const value = Number(text.replace(",", "."));
        if (!Number.isFinite(value) || value < 0) return setError("Enter your GPA as a number.");
        if (value > scale) return setError(`Your GPA can't be higher than the ${scale} scale.`);
        return onApply({ gpa: Math.round(value * 100) / 100, gpa_scale: scale });
      }
      case "test_scores":
        return onApply({ test_scores: scores });
      case "nationality":
      case "country_origin":
      case "destination_country":
        if (field !== "nationality" && !selection[0]) return setError("Please choose a country.");
        return onApply({ [field]: selection[0] ?? null });
      case "target_countries":
        return onApply({ target_countries: selection });
      case "intended_majors":
        return onApply({ intended_majors: selection });
      case "graduation_year":
        return onApply({ graduation_year: selection[0] ? Number(selection[0]) : null });
      case "level_of_study":
        if (!selection[0]) return setError("Please choose a degree level.");
        return onApply({ level_of_study: selection[0] as ProfileDetails["level_of_study"] });
      case "intake_term":
        return onApply({ intake_term: selection[0] ?? null });
      case "budget": {
        const option = BUDGET_OPTIONS.find((o) => `${o.min}-${o.max}` === selection[0]);
        return onApply({ budget_min: option?.min ?? null, budget_max: option?.max ?? null });
      }
    }
  };

  const toggle = (value: string, multi: boolean) =>
    setSelection((current) =>
      multi
        ? current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value]
        : current[0] === value
          ? []
          : [value],
    );

  const textField = (keyboardType: KeyboardTypeOptions, placeholder: string, autoCapitalize: "none" | "words" = "words") => (
    <>
      <TextInput
        ref={inputRef}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={(value) => {
          setText(value);
          if (error) setError("");
        }}
        onSubmitEditing={done}
        placeholder={placeholder}
        placeholderTextColor={UI.muted}
        returnKeyType="done"
        style={[styles.input, !!error && styles.inputError]}
        value={text}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );

  const countryList = (list: Country[], multi: boolean) => {
    const needle = query.trim().toLowerCase();
    const filtered = needle ? list.filter((c) => c.name.toLowerCase().includes(needle)) : list;
    return (
      <>
        <View style={styles.searchBox}>
          <Search color={UI.muted} size={17} />
          <TextInput
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search countries"
            placeholderTextColor={UI.muted}
            style={styles.searchInput}
            value={query}
          />
        </View>
        <FlatList
          data={filtered}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(country) => country.code}
          renderItem={({ item }) => {
            const active = selection.includes(item.code);
            return (
              <Pressable onPress={() => toggle(item.code, multi)} style={styles.optionRow}>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {item.flag} {item.name}
                </Text>
                {active ? <Check color={UI.primary} size={18} strokeWidth={2.4} /> : null}
              </Pressable>
            );
          }}
          style={styles.optionList}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </>
    );
  };

  const chipOptions = (options: { value: string; label: string; hint?: string }[], multi: boolean, stacked = false) => (
    <View style={stacked ? styles.optionStack : styles.chips}>
      {options.map((option) => {
        const active = selection.includes(option.value);
        return stacked ? (
          <Pressable key={option.value} onPress={() => toggle(option.value, multi)} style={[styles.optionCard, active && styles.optionCardActive]}>
            <View style={styles.optionCardCopy}>
              <Text style={[styles.optionCardTitle, active && styles.optionTextActive]}>{option.label}</Text>
              {option.hint ? <Text style={styles.optionCardHint}>{option.hint}</Text> : null}
            </View>
            <View style={[styles.radio, active && styles.radioActive]}>
              {active ? <Check color="#FFFFFF" size={12} strokeWidth={3} /> : null}
            </View>
          </Pressable>
        ) : (
          <Pressable key={option.value} onPress={() => toggle(option.value, multi)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const thisYear = new Date().getFullYear();
  const minBirth = `${thisYear - 70}-01-01`;
  const maxBirth = (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 12);
    return toIsoDate(date);
  })();

  let body: React.ReactNode = null;
  switch (field) {
    case "full_name":
      body = textField("default", "Your full name");
      break;
    case "current_city":
      body = textField("default", "e.g. Tbilisi");
      break;
    case "current_school":
      body = textField("default", "e.g. Tbilisi Public School #1");
      break;
    case "email":
      body = textField("email-address", "you@example.com", "none");
      break;
    case "phone":
      body = textField("phone-pad", "+995 555 555 555", "none");
      break;
    case "date_of_birth":
      body = (
        <CalendarPicker maxDate={maxBirth} minDate={minBirth} onChange={setDateValue} value={dateValue} yearNavigation />
      );
      break;
    case "nationality":
      body = countryList(countries.all, false);
      break;
    case "country_origin":
      body = countryList(countries.origins, false);
      break;
    case "destination_country":
      body = countryList(countries.destinations, false);
      break;
    case "target_countries":
      body = countryList(countries.destinations, true);
      break;
    case "graduation_year":
      body = chipOptions(
        Array.from({ length: 14 }, (_, i) => String(thisYear - 6 + i)).map((year) => ({ value: year, label: year })),
        false,
      );
      break;
    case "gpa":
      body = (
        <>
          {textField("decimal-pad", "e.g. 3.6")}
          <Text style={styles.fieldLabel}>Scale</Text>
          <View style={styles.chips}>
            {GPA_SCALES.map((value) => (
              <Pressable key={value} onPress={() => setScale(value)} style={[styles.chip, scale === value && styles.chipActive]}>
                <Text style={[styles.chipText, scale === value && styles.chipTextActive]}>{value.toFixed(1)}</Text>
              </Pressable>
            ))}
          </View>
        </>
      );
      break;
    case "test_scores":
      body = (
        <>
          {scores.length ? (
            <View style={styles.chips}>
              {scores.map((score, index) => (
                <View key={`${score.type}-${index}`} style={[styles.chip, styles.chipActive, styles.scoreChip]}>
                  <Text style={[styles.chipText, styles.chipTextActive]}>
                    {score.type} {score.score}
                  </Text>
                  <TouchableOpacity
                    accessibilityLabel={`Remove ${score.type}`}
                    hitSlop={8}
                    onPress={() => setScores((current) => current.filter((_, i) => i !== index))}
                  >
                    <X color="#FFFFFF" size={14} strokeWidth={2.6} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.helper}>Add the tests you've taken or plan to take.</Text>
          )}
          <Text style={styles.fieldLabel}>Add a score</Text>
          <View style={styles.chips}>
            {TEST_TYPES.map((type) => (
              <Pressable key={type} onPress={() => setTestType(type)} style={[styles.chip, testType === type && styles.chipActive]}>
                <Text style={[styles.chipText, testType === type && styles.chipTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.inlineAdd}>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                setSecondary(value);
                if (error) setError("");
              }}
              placeholder={`${testType} score`}
              placeholderTextColor={UI.muted}
              style={[styles.input, styles.inlineInput]}
              value={secondary}
            />
            <TouchableOpacity
              accessibilityLabel="Add score"
              onPress={() => {
                if (!secondary.trim()) return setError("Enter a score first.");
                setScores((current) => [...current.filter((s) => s.type !== testType), { type: testType, score: secondary.trim() }]);
                setSecondary("");
              }}
              style={styles.inlineButton}
            >
              <Plus color="#FFFFFF" size={20} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </>
      );
      break;
    case "level_of_study":
      body = (
        <>
          {chipOptions(
            DEGREE_OPTIONS.map((o) => ({ value: o.level, label: o.label, hint: o.hint })),
            false,
            true,
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </>
      );
      break;
    case "intended_majors": {
      const custom = selection.filter((m) => !MAJOR_SUGGESTIONS.includes(m));
      body = (
        <>
          <View style={styles.inlineAdd}>
            <TextInput
              onChangeText={setSecondary}
              onSubmitEditing={() => {
                const value = secondary.trim();
                if (value && !selection.includes(value)) setSelection((current) => [...current, value]);
                setSecondary("");
              }}
              placeholder="Type a major and press return"
              placeholderTextColor={UI.muted}
              returnKeyType="done"
              style={[styles.input, styles.inlineInput]}
              value={secondary}
            />
          </View>
          <ScrollView style={styles.optionList}>
            {chipOptions([...custom, ...MAJOR_SUGGESTIONS].map((m) => ({ value: m, label: m })), true)}
          </ScrollView>
        </>
      );
      break;
    }
    case "budget":
      body = chipOptions(
        BUDGET_OPTIONS.map((o) => ({ value: `${o.min}-${o.max}`, label: o.label })),
        false,
        true,
      );
      break;
    case "intake_term":
      body = chipOptions(upcomingIntakes().map((term) => ({ value: term, label: term })), false);
      break;
  }

  return (
    <BottomSheet
      footer={
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={done} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      }
      onClose={onClose}
      onOpened={() => inputRef.current?.focus()}
      title={TITLES[field]}
      visible={!!requestedField}
    >
      {body}
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  loading: {
    marginTop: 60,
  },
  loadError: {
    color: UI.textSecondary,
    fontSize: 14,
    marginTop: 40,
    paddingHorizontal: GUTTER,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingHorizontal: GUTTER - 4,
    paddingTop: 6,
  },
  backButton: {
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
    fontSize: 19,
    fontWeight: "700",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: RADIUS.pill,
    height: 36,
    justifyContent: "center",
    minWidth: 66,
    paddingHorizontal: 16,
  },
  saveButtonDisabled: {
    backgroundColor: "#FFC2C2",
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
  },
  content: {
    paddingBottom: 60,
    paddingHorizontal: GUTTER - 8,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 20,
    flexDirection: "row",
    gap: 14,
    marginTop: 6,
    padding: 16,
    ...CARD_SHADOW,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    overflow: "hidden",
    width: 68,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarInitials: {
    color: UI.primary,
    fontSize: 24,
    fontWeight: "800",
  },
  avatarBusy: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
  },
  profileCopy: {
    flex: 1,
  },
  profileName: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  profileStatus: {
    color: UI.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  avatarActions: {
    flexDirection: "row",
    gap: 18,
    marginTop: 10,
  },
  avatarChange: {
    color: UI.primary,
    fontSize: 12.5,
    fontWeight: "600",
  },
  avatarRemove: {
    color: UI.muted,
    fontSize: 12.5,
    fontWeight: "600",
  },
  completionCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 20,
    flexDirection: "row",
    gap: 14,
    marginTop: 12,
    padding: 16,
    ...CARD_SHADOW,
  },
  completionCopy: {
    flex: 1,
  },
  completionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  completionTitle: {
    color: UI.text,
    fontSize: 14.5,
    fontWeight: "700",
  },
  countPill: {
    backgroundColor: UI.successSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countPillText: {
    color: UI.success,
    fontSize: 11,
    fontWeight: "700",
  },
  track: {
    backgroundColor: UI.track,
    borderRadius: 4,
    height: 6,
    marginTop: 9,
    overflow: "hidden",
  },
  trackFill: {
    backgroundColor: UI.primary,
    borderRadius: 4,
    height: "100%",
  },
  completionNext: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 7,
  },
  completionNextField: {
    color: UI.primary,
    fontWeight: "600",
  },
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionEdit: {
    color: UI.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    backgroundColor: UI.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    ...CARD_SHADOW,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomColor: UI.hairline,
    borderBottomWidth: 1,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowCopy: {
    flex: 1,
  },
  rowLabel: {
    color: UI.muted,
    fontSize: 12,
  },
  rowChanged: {
    color: UI.primary,
    fontWeight: "600",
  },
  rowValue: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  rowPlaceholder: {
    color: UI.primary,
    fontWeight: "600",
  },
  danger: {
    color: UI.danger,
  },
  input: {
    backgroundColor: UI.background,
    borderColor: UI.border,
    borderRadius: 14,
    borderWidth: 1,
    color: UI.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: UI.danger,
  },
  errorText: {
    color: UI.danger,
    fontSize: 12.5,
    marginTop: 8,
  },
  helper: {
    color: UI.textSecondary,
    fontSize: 14,
  },
  fieldLabel: {
    color: UI.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: UI.background,
    borderColor: UI.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: UI.primary,
    borderColor: UI.primary,
  },
  chipText: {
    color: UI.textSecondary,
    fontSize: 13.5,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  scoreChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  inlineAdd: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    marginTop: 12,
  },
  inlineInput: {
    flex: 1,
  },
  inlineButton: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 14,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: UI.background,
    borderColor: UI.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 46,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: UI.text,
    flex: 1,
    fontSize: 15,
  },
  optionList: {
    marginTop: 8,
    maxHeight: 340,
  },
  optionRow: {
    alignItems: "center",
    borderBottomColor: UI.hairline,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  optionText: {
    color: UI.text,
    fontSize: 15.5,
  },
  optionTextActive: {
    color: UI.primary,
    fontWeight: "700",
  },
  optionStack: {
    gap: 10,
  },
  optionCard: {
    alignItems: "center",
    backgroundColor: UI.background,
    borderColor: UI.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 14,
  },
  optionCardActive: {
    backgroundColor: UI.primarySoft,
    borderColor: UI.primary,
  },
  optionCardCopy: {
    flex: 1,
  },
  optionCardTitle: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "600",
  },
  optionCardHint: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 2,
  },
  radio: {
    alignItems: "center",
    borderColor: "#C9C9D4",
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  radioActive: {
    backgroundColor: UI.primary,
    borderColor: UI.primary,
  },
  doneButton: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 28,
    height: 54,
    justifyContent: "center",
  },
  doneText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
