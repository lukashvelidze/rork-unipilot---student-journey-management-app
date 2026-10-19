import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { GraduationCap, Plus } from "lucide-react-native";
import type { JourneyWithProgress } from "@/lib/journeyProgress";

const PRIMARY = "#FF6B6B";
const TEXT = "#1A1A1A";
const MUTED = "#8888A0";
const BORDER = "#E6E6EC";

const CHIP_WIDTH = 144;
const CHIP_HEIGHT = 44;
const CHIP_GAP = 10;
const WORDMARK_BOX = { width: CHIP_WIDTH - 20, height: 28 };
const EMBLEM_SIZE = 28;
// Logos at least this wide are wordmarks and fill the chip on their own.
const WORDMARK_MIN_ASPECT = 1.7;

// Remember each logo's shape so chips don't re-flow every time they mount.
const aspectCache = new Map<string, number>();

type Props = {
  journeys: JourneyWithProgress[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  /** Opens the university picker. Shown as a trailing "+" chip. */
  onAdd: () => void;
  style?: StyleProp<ViewStyle>;
  /** Horizontal padding of the surrounding screen, so chips scroll edge to edge. */
  gutter?: number;
};

/**
 * Horizontal strip of the student's universities, one logo chip per study
 * journey. Legacy journeys that aren't tied to a university are left out and
 * replaced by a prompt to choose universities.
 */
export default function UniversityStrip({
  journeys,
  activeKey,
  onSelect,
  onAdd,
  style,
  gutter = 24,
}: Props) {
  const universityJourneys = journeys.filter((journey) => !!journey.journey?.university);
  const scrollRef = useRef<ScrollView>(null);
  const viewport = useRef({ offset: 0, width: 0 });
  const activeIndex = universityJourneys.findIndex((journey) => journey.key === activeKey);

  // Bring the active university into view (e.g. restored after a relaunch),
  // without moving the strip when it's already fully visible.
  useEffect(() => {
    if (activeIndex < 0 || !viewport.current.width) return;
    const chipStart = gutter + activeIndex * (CHIP_WIDTH + CHIP_GAP);
    const chipEnd = chipStart + CHIP_WIDTH;
    const { offset, width } = viewport.current;
    if (chipStart >= offset && chipEnd <= offset + width) return;
    scrollRef.current?.scrollTo({ x: Math.max(chipStart - gutter, 0), animated: true });
  }, [activeIndex, gutter]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      accessibilityRole="tablist"
      contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
      onLayout={(event) => {
        const firstLayout = !viewport.current.width;
        viewport.current.width = event.nativeEvent.layout.width;
        if (firstLayout && activeIndex > 0) {
          const chipStart = gutter + activeIndex * (CHIP_WIDTH + CHIP_GAP);
          if (chipStart + CHIP_WIDTH > viewport.current.width) {
            scrollRef.current?.scrollTo({ x: chipStart - gutter, animated: false });
          }
        }
      }}
      onScroll={(event) => {
        viewport.current.offset = event.nativeEvent.contentOffset.x;
      }}
      scrollEventThrottle={32}
      showsHorizontalScrollIndicator={false}
      style={[{ marginHorizontal: -gutter }, style]}
    >
      {universityJourneys.map((journey) => (
        <UniversityChip
          // Remount when the logo changes so its measured shape and error state reset.
          key={`${journey.key}:${journey.journey?.university?.logo_url ?? ""}`}
          active={journey.key === activeKey}
          journey={journey}
          onPress={() => onSelect(journey.key)}
        />
      ))}

      {universityJourneys.length === 0 ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.75}
          onPress={onAdd}
          style={[styles.chip, styles.promptChip]}
          testID="university-strip-choose"
        >
          <GraduationCap color={PRIMARY} size={18} strokeWidth={1.9} />
          <Text style={styles.promptText}>Choose your universities</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          accessibilityLabel="Add or change universities"
          accessibilityRole="button"
          activeOpacity={0.75}
          onPress={onAdd}
          style={[styles.chip, styles.addChip]}
          testID="university-strip-add"
        >
          <Plus color={MUTED} size={18} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function UniversityChip({
  journey,
  active,
  onPress,
}: {
  journey: JourneyWithProgress;
  active: boolean;
  onPress: () => void;
}) {
  const university = journey.journey!.university!;
  const logoUrl = university.logo_url || null;
  const [aspect, setAspect] = useState<number | null>(
    logoUrl ? aspectCache.get(logoUrl) ?? null : null,
  );
  const [logoFailed, setLogoFailed] = useState(false);

  const hasLogo = !!logoUrl && !logoFailed;
  // Still on a fallback checklist while the university's own route generates.
  const isPreparing = journey.source !== "university";
  // Until the image reports its size we lay it out as a wordmark; most
  // official university logos are.
  const isWordmark = hasLogo && (aspect === null || aspect >= WORDMARK_MIN_ASPECT);

  return (
    <TouchableOpacity
      accessibilityHint={isPreparing ? "Personalised roadmap is being prepared" : undefined}
      accessibilityLabel={university.name}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, !isWordmark && styles.chipWithName, active && styles.chipActive]}
      testID={`university-strip-${university.slug}`}
    >
      {hasLogo ? (
        <Image
          accessibilityIgnoresInvertColors
          cachePolicy="memory-disk"
          contentFit="contain"
          onError={() => setLogoFailed(true)}
          onLoad={(event) => {
            const { width, height } = event.source;
            if (!width || !height) return;
            aspectCache.set(logoUrl as string, width / height);
            setAspect(width / height);
          }}
          source={{ uri: logoUrl as string }}
          style={isWordmark ? WORDMARK_BOX : styles.emblem}
          transition={120}
        />
      ) : (
        <View style={[styles.monogram, active && styles.monogramActive]}>
          <Text style={[styles.monogramText, active && styles.monogramTextActive]}>
            {monogram(university.name)}
          </Text>
        </View>
      )}

      {isWordmark ? null : (
        <Text numberOfLines={2} style={[styles.name, active && styles.nameActive]}>
          {shortName(university.name)}
        </Text>
      )}

      {isPreparing ? <View style={styles.preparingDot} /> : null}
    </TouchableOpacity>
  );
}

const STOP_WORDS = new Set(["of", "the", "and", "for", "de", "di", "du", "la", "le", "der", "und", "&"]);

/** "University of Copenhagen" -> "UC", "ETH Zurich" -> "EZ". */
function monogram(name: string) {
  const letters = name
    .split(/[\s-]+/)
    .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()))
    .map((word) => word[0].toUpperCase());
  return letters.slice(0, 2).join("") || name.slice(0, 2).toUpperCase();
}

/** Drop the generic "University of" so the distinctive part fits the chip. */
function shortName(name: string) {
  const trimmed = name
    .replace(/^(the\s+)?university\s+of\s+/i, "")
    .replace(/\s+university$/i, "")
    .trim();
  return trimmed || name;
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: CHIP_GAP,
    paddingVertical: 4,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: BORDER,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    height: CHIP_HEIGHT,
    justifyContent: "center",
    width: CHIP_WIDTH,
  },
  chipWithName: {
    gap: 8,
    justifyContent: "flex-start",
    paddingHorizontal: 10,
  },
  chipActive: {
    backgroundColor: "#FFFFFF",
    borderColor: PRIMARY,
    borderWidth: 1.5,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  emblem: {
    height: EMBLEM_SIZE,
    width: EMBLEM_SIZE,
  },
  monogram: {
    alignItems: "center",
    backgroundColor: "#F2F2F6",
    borderRadius: EMBLEM_SIZE / 2,
    height: EMBLEM_SIZE,
    justifyContent: "center",
    width: EMBLEM_SIZE,
  },
  monogramActive: {
    backgroundColor: "#FFF0F0",
  },
  monogramText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "800",
  },
  monogramTextActive: {
    color: PRIMARY,
  },
  name: {
    color: "#5E5E6E",
    flexShrink: 1,
    fontSize: 11.5,
    fontWeight: "700",
    lineHeight: 14,
  },
  nameActive: {
    color: TEXT,
  },
  preparingDot: {
    backgroundColor: "#F5A524",
    borderColor: "#FFFFFF",
    borderRadius: 5,
    borderWidth: 1.5,
    height: 10,
    position: "absolute",
    right: -3,
    top: -3,
    width: 10,
  },
  addChip: {
    width: CHIP_HEIGHT,
  },
  promptChip: {
    borderColor: "#FFD0D0",
    borderStyle: "dashed",
    gap: 8,
    paddingHorizontal: 14,
    width: "auto",
  },
  promptText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "700",
  },
});
