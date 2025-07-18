/**
 * Safe Native Module Wrapper
 * Prevents iOS crashes when calling native modules
 */

import { NativeModules, Platform } from 'react-native';
import { IOSCrashPrevention } from './iosCrashPrevention';
import { BridgeErrorHandler } from './bridgeErrorHandler';

export class SafeNativeModules {
  /**
   * Safely call a native module method
   */
  static call<T>(
    moduleName: string,
    methodName: string,
    args: any[] = [],
    fallbackValue?: T
  ): T | null {
    try {
      const module = NativeModules[moduleName];
      
      if (!module) {
        console.warn(`Native module ${moduleName} not found`);
        return fallbackValue ?? null;
      }
      
      const method = module[methodName];
      
      if (!method) {
        console.warn(`Method ${methodName} not found in native module ${moduleName}`);
        return fallbackValue ?? null;
      }
      
      // Use iOS crash prevention for iOS devices
      if (Platform.OS === 'ios') {
        return IOSCrashPrevention.wrapNativeModuleCall(
          moduleName,
          methodName,
          () => method.apply(module, args),
          fallbackValue
        );
      }
      
      // Use bridge error handler for other platforms
      return BridgeErrorHandler.wrapSyncCall(
        () => method.apply(module, args),
        `${moduleName}.${methodName}`,
        fallbackValue
      );
      
    } catch (error) {
      console.error(`Error calling native module ${moduleName}.${methodName}:`, error);
      return fallbackValue ?? null;
    }
  }

  /**
   * Safely call an async native module method
   */
  static async callAsync<T>(
    moduleName: string,
    methodName: string,
    args: any[] = [],
    fallbackValue?: T
  ): Promise<T | null> {
    try {
      const module = NativeModules[moduleName];
      
      if (!module) {
        console.warn(`Native module ${moduleName} not found`);
        return fallbackValue ?? null;
      }
      
      const method = module[methodName];
      
      if (!method) {
        console.warn(`Method ${methodName} not found in native module ${moduleName}`);
        return fallbackValue ?? null;
      }
      
      // Use iOS crash prevention for iOS devices
      if (Platform.OS === 'ios') {
        return await IOSCrashPrevention.safeExecute(
          async () => {
            const result = await method.apply(module, args);
            return result;
          },
          `${moduleName}.${methodName}`,
          fallbackValue
        );
      }
      
      // Use bridge error handler for other platforms
      return await BridgeErrorHandler.wrapAsyncCall(
        async () => {
          const result = await method.apply(module, args);
          return result;
        },
        `${moduleName}.${methodName}`,
        fallbackValue
      );
      
    } catch (error) {
      console.error(`Error calling async native module ${moduleName}.${methodName}:`, error);
      return fallbackValue ?? null;
    }
  }

  /**
   * Safely access a native module
   */
  static getModule(moduleName: string): any | null {
    try {
      const module = NativeModules[moduleName];
      
      if (!module) {
        console.warn(`Native module ${moduleName} not found`);
        return null;
      }
      
      return module;
    } catch (error) {
      console.error(`Error accessing native module ${moduleName}:`, error);
      return null;
    }
  }

  /**
   * Check if a native module is available
   */
  static isModuleAvailable(moduleName: string): boolean {
    try {
      return !!NativeModules[moduleName];
    } catch (error) {
      console.error(`Error checking native module availability ${moduleName}:`, error);
      return false;
    }
  }

  /**
   * Safely call multiple native module methods in sequence
   */
  static async callSequence<T>(
    calls: Array<{
      moduleName: string;
      methodName: string;
      args?: any[];
      fallbackValue?: T;
    }>
  ): Promise<(T | null)[]> {
    const results: (T | null)[] = [];
    
    for (const call of calls) {
      try {
        const result = await this.callAsync(
          call.moduleName,
          call.methodName,
          call.args || [],
          call.fallbackValue
        );
        results.push(result);
      } catch (error) {
        console.error(`Error in sequence call ${call.moduleName}.${call.methodName}:`, error);
        results.push(call.fallbackValue ?? null);
      }
    }
    
    return results;
  }
}

// Export commonly used native modules with safe wrappers
export const SafeAsyncStorage = {
  getItem: (key: string) => SafeNativeModules.callAsync('AsyncStorage', 'getItem', [key], null),
  setItem: (key: string, value: string) => SafeNativeModules.callAsync('AsyncStorage', 'setItem', [key, value], null),
  removeItem: (key: string) => SafeNativeModules.callAsync('AsyncStorage', 'removeItem', [key], null),
  clear: () => SafeNativeModules.callAsync('AsyncStorage', 'clear', [], null),
  getAllKeys: () => SafeNativeModules.callAsync('AsyncStorage', 'getAllKeys', [], []),
};

export const SafeHaptics = {
  impactAsync: (style: string) => SafeNativeModules.callAsync('ExpoHaptics', 'impactAsync', [style], null),
  notificationAsync: (type: string) => SafeNativeModules.callAsync('ExpoHaptics', 'notificationAsync', [type], null),
  selectionAsync: () => SafeNativeModules.callAsync('ExpoHaptics', 'selectionAsync', [], null),
};

export const SafeConstants = {
  get: () => SafeNativeModules.call('ExpoConstants', 'get', [], {}),
};