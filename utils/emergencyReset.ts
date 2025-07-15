import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Emergency reset utility for clearing corrupted store data
 * Use this if stores are causing persistent crashes
 */

interface ResetOptions {
  clearAll?: boolean;
  clearUserData?: boolean;
  clearTheme?: boolean;
  clearJourney?: boolean;
  clearDocuments?: boolean;
}

export async function emergencyReset(options: ResetOptions = { clearAll: true }): Promise<void> {
  console.log('🚨 Emergency reset initiated with options:', options);
  
  try {
    const keysToRemove: string[] = [];
    
    if (options.clearAll) {
      // Clear all app storage
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => 
        key.includes('user-storage') || 
        key.includes('theme-storage') || 
        key.includes('journey-storage') || 
        key.includes('document-storage')
      );
      keysToRemove.push(...appKeys);
    } else {
      // Selective clearing
      if (options.clearUserData) keysToRemove.push('user-storage');
      if (options.clearTheme) keysToRemove.push('theme-storage');
      if (options.clearJourney) keysToRemove.push('journey-storage');
      if (options.clearDocuments) keysToRemove.push('document-storage');
    }
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ Emergency reset completed. Cleared keys:', keysToRemove);
    } else {
      console.log('ℹ️ No keys to clear');
    }
    
  } catch (error) {
    console.error('❌ Emergency reset failed:', error);
    // If multiRemove fails, try clearing everything
    try {
      await AsyncStorage.clear();
      console.log('✅ Full AsyncStorage cleared as fallback');
    } catch (clearError) {
      console.error('❌ Even AsyncStorage.clear() failed:', clearError);
    }
  }
}

/**
 * Safe store access wrapper that can trigger emergency reset
 */
export function withEmergencyReset<T>(
  storeAccess: () => T,
  storeName: string
): T | null {
  try {
    return storeAccess();
  } catch (error) {
    console.error(`Store access failed for ${storeName}:`, error);
    
    // Check if this looks like a store corruption issue
    if (error instanceof Error && (
      error.message.includes('JSON') ||
      error.message.includes('parse') ||
      error.message.includes('hydrate')
    )) {
      console.warn(`🚨 Store corruption detected in ${storeName}, initiating emergency reset`);
      
      // Async emergency reset (don't block the current operation)
      emergencyReset({ clearAll: false, [storeName]: true }).catch(resetError => {
        console.error('Emergency reset failed:', resetError);
      });
    }
    
    return null;
  }
}

/**
 * Check if app has crashed recently and should reset
 */
export async function checkAndResetIfNeeded(): Promise<boolean> {
  try {
    const crashCount = await AsyncStorage.getItem('app-crash-count');
    const lastCrash = await AsyncStorage.getItem('last-crash-time');
    
    const count = crashCount ? parseInt(crashCount) : 0;
    const lastCrashTime = lastCrash ? parseInt(lastCrash) : 0;
    const now = Date.now();
    
    // If crashed more than 3 times in the last 10 minutes
    if (count >= 3 && (now - lastCrashTime) < 10 * 60 * 1000) {
      console.log('🚨 Multiple crashes detected, performing emergency reset');
      await emergencyReset();
      await AsyncStorage.setItem('app-crash-count', '0');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking crash count:', error);
    return false;
  }
}

/**
 * Record a crash occurrence
 */
export async function recordCrash(): Promise<void> {
  try {
    const crashCount = await AsyncStorage.getItem('app-crash-count');
    const count = crashCount ? parseInt(crashCount) : 0;
    
    await AsyncStorage.multiSet([
      ['app-crash-count', (count + 1).toString()],
      ['last-crash-time', Date.now().toString()]
    ]);
    
    console.log(`Crash recorded. Total crashes: ${count + 1}`);
  } catch (error) {
    console.error('Error recording crash:', error);
  }
}