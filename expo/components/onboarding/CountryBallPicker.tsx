import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X } from "lucide-react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Country } from "@/types/user";
import OnboardingProgressHeader from "@/components/onboarding/OnboardingProgressHeader";

const CORAL = "#FF6B6B";
const FEATURED_COUNTRIES = [
  "DE",
  "SE",
  "NO",
  "IE",
  "FI",
  "SK",
  "CN",
  "CZ",
  "ES",
];
const COUNTRIES_PER_COLUMN = 3;
const ORB_SIZES = [88, 72, 94, 78, 84, 68, 90, 76, 82];
const ORB_HORIZONTAL_OFFSETS = [-6, 8, -2, 10, -8, 4];
const AUTO_SCROLL_INTERVAL_MS = 50;
const AUTO_SCROLL_PIXELS_PER_TICK = 0.65;
const FILTER_OUT_DURATION_MS = 110;
const FILTER_IN_DURATION_MS = 240;

interface CountryBallPickerProps {
  countries: Country[];
  error?: string;
  isLoading: boolean;
  isProcessing: boolean;
  onBack: () => void;
  onRetry: () => void;
  onSelect: (country: Country) => void;
  progress: number;
  selectedCountry: Country | null;
  subtitle: string;
  title: string;
}

interface CountryOrbProps {
  animateEntrance: boolean;
  country: Country;
  index: number;
  isProcessing: boolean;
  isSelected: boolean;
  onPress: () => void;
}

const CountryOrb = memo(function CountryOrb({
  animateEntrance,
  country,
  index,
  isProcessing,
  isSelected,
  onPress,
}: CountryOrbProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const size = ORB_SIZES[index % ORB_SIZES.length];
  const horizontalOffset =
    ORB_HORIZONTAL_OFFSETS[index % ORB_HORIZONTAL_OFFSETS.length];
  const countryCode = country.code.trim().toLowerCase();
  const canLoadFlagImage = countryCode.length === 2 && !imageFailed;

  return (
    <Animated.View
      entering={
        animateEntrance
          ? FadeInDown.delay(Math.min(index, 8) * 20)
              .duration(220)
              .easing(Easing.bezier(0.22, 1, 0.36, 1))
          : undefined
      }
      style={[styles.orbItem, { transform: [{ translateX: horizontalOffset }] }]}
    >
      <Pressable
        accessibilityLabel={`Select ${country.name}`}
        accessibilityRole="button"
        accessibilityState={{ busy: isSelected && isProcessing, selected: isSelected }}
        disabled={isProcessing}
        onPress={onPress}
        style={({ pressed }) => [
          styles.orb,
          {
            borderColor: isSelected ? CORAL : "#FFFFFF",
            height: size,
            opacity: pressed ? 0.84 : 1,
            transform: [{ scale: pressed ? 0.96 : isSelected ? 1.03 : 1 }],
            width: size,
          },
        ]}
        testID={`country-ball-${country.code}`}
      >
        <Text style={[styles.flagFallback, { fontSize: size * 0.48 }]}>
          {country.flag || "🌍"}
        </Text>
        {canLoadFlagImage ? (
          <Image
            onError={() => setImageFailed(true)}
            resizeMode="cover"
            source={{ uri: `https://flagcdn.com/w320/${countryCode}.png` }}
            style={styles.flagImage}
          />
        ) : null}
        {isSelected && isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color="#FFFFFF" size="small" />
          </View>
        ) : null}
      </Pressable>
      <Text
        numberOfLines={1}
        style={[styles.countryName, isSelected && styles.selectedCountryName]}
      >
        {country.name}
      </Text>
    </Animated.View>
  );
});

function chunkCountries(countries: Country[]) {
  const columns: Country[][] = [];

  for (let index = 0; index < countries.length; index += COUNTRIES_PER_COLUMN) {
    columns.push(countries.slice(index, index + COUNTRIES_PER_COLUMN));
  }

  return columns;
}

export default function CountryBallPicker({
  countries,
  error,
  isLoading,
  isProcessing,
  onBack,
  onRetry,
  onSelect,
  progress,
  selectedCountry,
  subtitle,
  title,
}: CountryBallPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const listRef = useRef<FlatList<Country[]>>(null);
  const contentWidthRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const autoScrollStoppedRef = useRef(false);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const reducedMotion = useReducedMotion();
  const resultsOpacity = useSharedValue(1);
  const resultsScale = useSharedValue(1);
  const resultsTranslateY = useSharedValue(0);
  const resultsMotionStyle = useAnimatedStyle(() => ({
    opacity: resultsOpacity.value,
    transform: [
      { translateY: resultsTranslateY.value },
      { scale: resultsScale.value },
    ],
  }));

  const visibleCountries = useMemo(() => {
    const normalizedQuery = appliedSearchQuery.trim().toLowerCase();
    const filtered = countries.filter(
      (country) =>
        !normalizedQuery ||
        country.name.toLowerCase().includes(normalizedQuery) ||
        country.code.toLowerCase().includes(normalizedQuery),
    );

    if (normalizedQuery) return filtered;

    return [...filtered].sort((first, second) => {
      const firstRank = FEATURED_COUNTRIES.indexOf(first.code.toUpperCase());
      const secondRank = FEATURED_COUNTRIES.indexOf(second.code.toUpperCase());
      const safeFirstRank =
        firstRank === -1 ? FEATURED_COUNTRIES.length : firstRank;
      const safeSecondRank =
        secondRank === -1 ? FEATURED_COUNTRIES.length : secondRank;
      return safeFirstRank - safeSecondRank;
    });
  }, [appliedSearchQuery, countries]);

  const countryColumns = useMemo(
    () => chunkCountries(visibleCountries),
    [visibleCountries],
  );

  const stopAutoScroll = useCallback(() => {
    autoScrollStoppedRef.current = true;

    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (searchQuery === appliedSearchQuery) return undefined;

    if (reducedMotion) {
      setAppliedSearchQuery(searchQuery);
      return undefined;
    }

    resultsOpacity.value = withTiming(0, {
      duration: FILTER_OUT_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    resultsScale.value = withTiming(0.985, {
      duration: FILTER_OUT_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    resultsTranslateY.value = withTiming(6, {
      duration: FILTER_OUT_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });

    const filterTimer = setTimeout(() => {
      setAppliedSearchQuery(searchQuery);
    }, FILTER_OUT_DURATION_MS);

    return () => clearTimeout(filterTimer);
  }, [
    appliedSearchQuery,
    reducedMotion,
    resultsOpacity,
    resultsScale,
    resultsTranslateY,
    searchQuery,
  ]);

  useEffect(() => {
    if (reducedMotion) {
      resultsOpacity.value = 1;
      resultsScale.value = 1;
      resultsTranslateY.value = 0;
      return;
    }

    resultsOpacity.value = withTiming(1, {
      duration: FILTER_IN_DURATION_MS,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    resultsScale.value = withTiming(1, {
      duration: FILTER_IN_DURATION_MS,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    resultsTranslateY.value = withTiming(0, {
      duration: FILTER_IN_DURATION_MS,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [
    appliedSearchQuery,
    reducedMotion,
    resultsOpacity,
    resultsScale,
    resultsTranslateY,
  ]);

  useEffect(() => {
    let mounted = true;

    scrollOffsetRef.current = 0;
    listRef.current?.scrollToOffset({ animated: false, offset: 0 });

    if (searchQuery || countryColumns.length < 4 || autoScrollStoppedRef.current) {
      return undefined;
    }

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted || reduceMotion || autoScrollStoppedRef.current) return;

      autoScrollIntervalRef.current = setInterval(() => {
        const maximumOffset = Math.max(
          0,
          contentWidthRef.current - viewportWidthRef.current,
        );

        if (maximumOffset <= 0 || autoScrollStoppedRef.current) return;

        const nextOffset = Math.min(
          scrollOffsetRef.current + AUTO_SCROLL_PIXELS_PER_TICK,
          maximumOffset,
        );
        scrollOffsetRef.current = nextOffset;
        listRef.current?.scrollToOffset({ animated: false, offset: nextOffset });

        if (nextOffset >= maximumOffset) {
          stopAutoScroll();
        }
      }, AUTO_SCROLL_INTERVAL_MS);
    });

    return () => {
      mounted = false;

      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [countryColumns.length, searchQuery, stopAutoScroll]);

  const handleSearchChange = (value: string) => {
    stopAutoScroll();
    setSearchQuery(value);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <OnboardingProgressHeader onBack={onBack} progress={progress} />

      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.searchShell}>
        <Search color="#94A3B8" size={20} strokeWidth={1.8} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={handleSearchChange}
          placeholder="Search..."
          placeholderTextColor="#64748B"
          returnKeyType="search"
          style={styles.searchInput}
          testID="country-search-input"
          value={searchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            accessibilityLabel="Clear country search"
            accessibilityRole="button"
            onPress={() => handleSearchChange("")}
            style={styles.clearButton}
          >
            <X color="#64748B" size={18} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.listArea}>
        <View pointerEvents="none" style={styles.decorativeGlowTop} />
        <View pointerEvents="none" style={styles.decorativeGlowBottom} />

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={CORAL} size="large" />
            <Text style={styles.stateText}>Loading countries...</Text>
          </View>
        ) : error && countries.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View
            pointerEvents={
              searchQuery === appliedSearchQuery ? "auto" : "none"
            }
            style={[styles.resultsSurface, resultsMotionStyle]}
          >
            {visibleCountries.length === 0 ? (
              <View style={styles.centerState}>
                <Text style={styles.stateTitle}>No countries found</Text>
                <Text style={styles.stateText}>
                  Try another country name or code.
                </Text>
              </View>
            ) : (
              <FlatList
                accessibilityLabel="Country choices, horizontally scrollable"
                contentContainerStyle={styles.countryList}
                data={countryColumns}
                decelerationRate="fast"
                horizontal
                initialNumToRender={5}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                keyExtractor={(column) =>
                  column.map((country) => country.code).join("-")
                }
                maxToRenderPerBatch={5}
                onContentSizeChange={(width) => {
                  contentWidthRef.current = width;
                }}
                onLayout={(event) => {
                  viewportWidthRef.current = event.nativeEvent.layout.width;
                }}
                onScroll={(event) => {
                  scrollOffsetRef.current = event.nativeEvent.contentOffset.x;
                }}
                onScrollBeginDrag={stopAutoScroll}
                onTouchStart={stopAutoScroll}
                ref={listRef}
                renderItem={({ item: column, index: columnIndex }) => (
                  <View
                    style={[
                      styles.countryColumn,
                      columnIndex % 2 === 1 && styles.offsetCountryColumn,
                    ]}
                  >
                    {column.map((country, rowIndex) => {
                      const countryIndex =
                        columnIndex * COUNTRIES_PER_COLUMN + rowIndex;

                      return (
                        <CountryOrb
                          animateEntrance={
                            !reducedMotion && Boolean(appliedSearchQuery.trim())
                          }
                          country={country}
                          index={countryIndex}
                          isProcessing={isProcessing}
                          isSelected={selectedCountry?.code === country.code}
                          key={country.code}
                          onPress={() => onSelect(country)}
                        />
                      );
                    })}
                  </View>
                )}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                windowSize={5}
              />
            )}
          </Animated.View>
        )}
      </View>

      {error && countries.length > 0 ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {error}
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 24,
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 354,
    textAlign: "center",
  },
  searchShell: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    height: 46,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: "#111827",
    flex: 1,
    fontSize: 16,
    height: "100%",
    marginLeft: 6,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  clearButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    marginRight: -8,
    width: 32,
  },
  listArea: {
    flex: 1,
    marginTop: 12,
    overflow: "hidden",
  },
  decorativeGlowTop: {
    backgroundColor: "rgba(255, 107, 107, 0.055)",
    borderRadius: 90,
    height: 180,
    position: "absolute",
    right: -90,
    top: 12,
    width: 180,
  },
  decorativeGlowBottom: {
    backgroundColor: "rgba(78, 205, 196, 0.04)",
    borderRadius: 80,
    bottom: 16,
    height: 160,
    left: -92,
    position: "absolute",
    width: 160,
  },
  countryList: {
    alignItems: "stretch",
    paddingBottom: 10,
    paddingHorizontal: 18,
    paddingRight: 72,
    paddingTop: 4,
  },
  resultsSurface: {
    flex: 1,
  },
  countryColumn: {
    alignItems: "center",
    height: "100%",
    justifyContent: "space-evenly",
    marginRight: 2,
    width: 112,
  },
  offsetCountryColumn: {
    paddingBottom: 2,
    paddingTop: 28,
  },
  orbItem: {
    alignItems: "center",
    minHeight: 120,
    width: 106,
  },
  orb: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 999,
    borderWidth: 3,
    elevation: 6,
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#334155",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  flagFallback: {
    textAlign: "center",
  },
  flagImage: {
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    width: "100%",
  },
  processingOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.34)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  countryName: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 6,
    maxWidth: 100,
    textAlign: "center",
  },
  selectedCountryName: {
    color: CORAL,
    fontWeight: "700",
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  stateTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
  stateText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: CORAL,
    borderRadius: 18,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  inlineError: {
    color: "#DC2626",
    fontSize: 13,
    paddingBottom: 10,
    paddingHorizontal: 24,
    textAlign: "center",
  },
});
