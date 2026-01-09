/**
 * Correct Zustand storage configuration for React Native + Hermes (2025)
 *
 * This prevents the 0x120 SIGSEGV crash in Hermes that happens when:
 * 1. You have Map, Set, Date, or class instances in Zustand stores
 * 2. Default JSON.stringify/parse silently loses these non-plain values
 * 3. Later enumeration (Object.values/entries/spread) crashes Hermes
 *
 * Solution: Use 'flatted' library which correctly serializes/deserializes
 * Map, Set, Date, and circular references.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistStorage, StorageValue } from "zustand/middleware";
import { parse, stringify } from "flatted";

/**
 * Storage adapter using flatted for safe serialization of Map, Set, Date, etc.
 * This is the correct fix for Hermes enumeration crashes in 2025.
 */
export const flattedStorage: PersistStorage<unknown> = {
  getItem: async (key: string): Promise<StorageValue<unknown> | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;

      // Detect and handle legacy JSON data (from old JSON.stringify approach)
      // Zustand persist stores data as: {"state": {...}, "version": 3}
      // Flatted converts this entire object to its array format
      // Legacy JSON.stringify would produce: {"state":{...},"version":3}
      // Flatted.stringify produces: ["object structure with special markers"]
      const trimmedValue = value.trim();

      // Quick check: if it starts with '{' and contains '"state":', it's likely legacy JSON
      if (trimmedValue.startsWith('{') && trimmedValue.includes('"state":')) {
        console.warn(`⚠️  ${key}: detected legacy JSON format (contains "state" key), clearing...`);
        await AsyncStorage.removeItem(key);
        return null; // Zustand will use default state from store definition
      }

      try {
        const parsed = parse(value);
        return parsed;
      } catch (parseError) {
        // If parse fails, it's corrupted data (possibly mixed format or incomplete write)
        console.error(`❌ Failed to parse ${key}, clearing and using defaults:`, parseError);
        // Critical: Remove corrupted data immediately to prevent future crashes
        await AsyncStorage.removeItem(key);
        return null; // Zustand will use default state from store definition
      }
    } catch (error) {
      console.error(`❌ Error reading ${key}:`, error);
      return null; // Safe fallback
    }
  },
  setItem: async (key: string, value: StorageValue<unknown>) => {
    try {
      await AsyncStorage.setItem(key, stringify(value));
    } catch (error) {
      console.error(`❌ Error setting item ${key}:`, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`❌ Error removing item ${key}:`, error);
    }
  },
};

/**
 * Pre-rehydration cleanup - removes corrupted data BEFORE Zustand tries to load it
 * This prevents crashes during rehydration from old JSON-serialized data
 */
export async function preRehydrationCleanup() {
  const storageKeys = [
    'user-storage',
    'journey-storage',
    'document-storage',
    'theme-storage',
  ];

  console.log('🧹 Starting pre-rehydration cleanup...');

  for (const key of storageKeys) {
    try {
      const rawData = await AsyncStorage.getItem(key);
      if (rawData) {
        const trimmedData = rawData.trim();

        // Check for legacy JSON format first
        if (trimmedData.startsWith('{') && trimmedData.includes('"state":')) {
          console.warn(`⚠️  ${key}: legacy JSON format detected, clearing...`);
          await AsyncStorage.removeItem(key);
          console.log(`✅ ${key}: cleared successfully`);
        } else {
          try {
            // Attempt to parse with flatted - if this fails, data is corrupted
            parse(rawData);
            console.log(`✅ ${key}: valid flatted data`);
          } catch (parseError) {
            // Corrupted data detected - clear immediately
            console.warn(`⚠️  ${key}: corrupted data detected, clearing...`);
            await AsyncStorage.removeItem(key);
            console.log(`✅ ${key}: cleared successfully`);
          }
        }
      } else {
        console.log(`ℹ️  ${key}: no data (fresh install or already cleared)`);
      }
    } catch (error) {
      console.error(`❌ ${key}: error during cleanup check:`, error);
      // Continue to next key - don't crash cleanup itself
    }
  }

  console.log('✅ Pre-rehydration cleanup completed');
}

/**
 * Clear all Zustand persisted storage
 * Use this to clear corrupted data from old incorrect serialization
 */
export async function clearAllPersistedStorage() {
  try {
    const keys = [
      'user-storage',
      'journey-storage',
      'document-storage',
      'theme-storage',
    ];

    console.log('Clearing all persisted storage to remove corrupted data...');
    await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    console.log('All persisted storage cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear persisted storage:', error);
    return false;
  }
}
