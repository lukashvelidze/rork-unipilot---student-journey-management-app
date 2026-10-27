import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { UI } from "@/constants/design";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const pad = (n: number) => String(n).padStart(2, "0");
export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

type Props = {
  /** Selected date as YYYY-MM-DD. */
  value: string | null;
  onChange: (iso: string) => void;
  minDate?: string;
  maxDate?: string;
  /** Show year steppers (useful for birth dates). */
  yearNavigation?: boolean;
};

/** Lightweight month calendar (no native module needed). */
export default function CalendarPicker({ value, onChange, minDate, maxDate, yearNavigation }: Props) {
  const initial = value ? fromIso(value) : maxDate && fromIso(maxDate) < new Date() ? fromIso(maxDate) : new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: days }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
    ];
  }, [cursor]);

  const shift = (months: number) =>
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + months, 1));

  const today = toIsoDate(new Date());

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.navGroup}>
          {yearNavigation ? (
            <NavButton label="Previous year" onPress={() => shift(-12)} double />
          ) : null}
          <NavButton label="Previous month" onPress={() => shift(-1)} />
        </View>
        <Text style={styles.month}>
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </Text>
        <View style={styles.navGroup}>
          <NavButton label="Next month" onPress={() => shift(1)} forward />
          {yearNavigation ? (
            <NavButton label="Next year" onPress={() => shift(12)} forward double />
          ) : null}
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, index) => {
          if (!date) return <View key={`empty-${index}`} style={styles.cell} />;
          const iso = toIsoDate(date);
          const disabled = (minDate && iso < minDate) || (maxDate && iso > maxDate);
          const selected = iso === value;
          return (
            <Pressable
              key={iso}
              accessibilityLabel={iso}
              accessibilityState={{ selected, disabled: !!disabled }}
              disabled={!!disabled}
              onPress={() => onChange(iso)}
              style={styles.cell}
            >
              <View style={[styles.day, selected && styles.daySelected, iso === today && !selected && styles.dayToday]}>
                <Text
                  style={[
                    styles.dayText,
                    disabled && styles.dayDisabled,
                    selected && styles.dayTextSelected,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NavButton({
  label,
  onPress,
  forward,
  double,
}: {
  label: string;
  onPress: () => void;
  forward?: boolean;
  double?: boolean;
}) {
  const Icon = forward ? ChevronRight : ChevronLeft;
  return (
    <TouchableOpacity accessibilityLabel={label} hitSlop={8} onPress={onPress} style={styles.nav}>
      <Icon color={UI.text} size={18} strokeWidth={2} />
      {double ? <Icon color={UI.text} size={18} strokeWidth={2} style={styles.doubleIcon} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navGroup: {
    flexDirection: "row",
    gap: 4,
    minWidth: 72,
  },
  nav: {
    alignItems: "center",
    backgroundColor: UI.background,
    borderRadius: 10,
    flexDirection: "row",
    height: 32,
    justifyContent: "center",
    minWidth: 32,
    paddingHorizontal: 6,
  },
  doubleIcon: {
    marginLeft: -12,
  },
  month: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
  },
  weekday: {
    color: UI.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 6,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: `${100 / 7}%`,
  },
  day: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  daySelected: {
    backgroundColor: UI.primary,
  },
  dayToday: {
    borderColor: UI.primary,
    borderWidth: 1,
  },
  dayText: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dayDisabled: {
    color: "#C9C9D4",
  },
});
