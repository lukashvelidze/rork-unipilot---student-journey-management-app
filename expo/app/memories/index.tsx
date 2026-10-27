import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Camera, Plus } from "lucide-react-native";
import MemoryCard from "@/components/MemoryCard";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { useJourneyStore } from "@/store/journeyStore";

/** The student's journey memories (moved here from the old Tasks tab). */
export default function MemoriesScreen() {
  const router = useRouter();
  const handleBack = useAppBack("/(tabs)/profile");
  const { memories, loadMemories } = useJourneyStore();
  const [loading, setLoading] = useState(memories.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      await loadMemories();
    } catch (error) {
      console.error("Failed to load memories:", error);
    } finally {
      setLoading(false);
    }
  }, [loadMemories]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" hitSlop={10} onPress={handleBack} style={styles.iconButton}>
          <ArrowLeft color={UI.text} size={22} strokeWidth={2} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.title}>
          Memories
        </Text>
        <TouchableOpacity
          accessibilityLabel="Add a memory"
          hitSlop={10}
          onPress={() => router.push("/memories/new")}
          style={[styles.iconButton, styles.addButton]}
        >
          <Plus color={UI.text} size={22} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={UI.primary} style={styles.loading} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={memories}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(memory) => memory.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Camera color={UI.primary} size={24} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>Capture your journey</Text>
              <Text style={styles.emptyText}>
                Save the moments that matter: your first offer, visa day, your first week on campus.
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/memories/new")} style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Add your first memory</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              refreshing={refreshing}
              tintColor={UI.primary}
            />
          }
          renderItem={({ item }) => (
            <MemoryCard memory={item} onPress={() => router.push(`/memories/${item.id}` as any)} />
          )}
        />
      )}
    </SafeAreaView>
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
    paddingHorizontal: GUTTER,
    paddingVertical: 12,
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  addButton: {
    backgroundColor: UI.card,
    borderRadius: 22,
    ...CARD_SHADOW,
  },
  title: {
    color: UI.text,
    fontSize: 20,
    fontWeight: "700",
  },
  loading: {
    marginTop: 60,
  },
  list: {
    paddingBottom: 60,
    paddingHorizontal: GUTTER,
    paddingTop: 8,
  },
  separator: {
    height: 14,
  },
  empty: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    marginTop: 24,
    padding: 24,
    ...CARD_SHADOW,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    width: 48,
  },
  emptyTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: UI.primary,
    borderRadius: RADIUS.pill,
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
