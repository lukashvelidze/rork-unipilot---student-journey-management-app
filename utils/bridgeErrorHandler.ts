/**
 * Bridge Error Handler Utility
 * Prevents React Native bridge crashes by safely wrapping async operations
 * Enhanced with PC alignment error detection and memory protection
 */

import { memoryProtection } from './memoryProtection';

export class BridgeErrorHandler {
  /**
   * Safely wraps async function calls that might cause bridge exceptions
   */
  static async wrapAsyncCall<T>(
    fn: () => Promise<T>,
    context: string,
    fallbackValue?: T
  ): Promise<T | null> {
    // Perform memory safety check before operation
    memoryProtection.performMemoryCheck();
    
    if (!memoryProtection.isSafeToAllocate()) {
      console.warn(`Bridge operation ${context} skipped - memory not safe`);
      return fallbackValue ?? null;
    }
    
    try {
      const result = await fn();
      return result;
    } catch (error) {
      console.error(`Bridge error in ${context}:`, error);
      
      // Check if this looks like a bridge-related or alignment error
      const isBridgeError = this.isBridgeRelatedError(error);
      const isAlignmentError = this.isAlignmentRelatedError(error);
      
      if (isBridgeError || isAlignmentError) {
        console.warn(`${isAlignmentError ? 'Alignment' : 'Bridge'} error detected in ${context}, returning fallback value`);
        
        // Trigger memory cleanup for alignment errors
        if (isAlignmentError) {
          memoryProtection.performMemoryCheck();
        }
        
        return fallbackValue ?? null;
      }
      
      // Re-throw non-bridge/alignment errors
      throw error;
    }
  }

  /**
   * Safely wraps sync function calls that might cause bridge exceptions
   */
  static wrapSyncCall<T>(
    fn: () => T,
    context: string,
    fallbackValue?: T
  ): T | null {
    // Perform memory safety check before operation
    memoryProtection.performMemoryCheck();
    
    if (!memoryProtection.isSafeToAllocate()) {
      console.warn(`Sync bridge operation ${context} skipped - memory not safe`);
      return fallbackValue ?? null;
    }
    
    try {
      return fn();
    } catch (error) {
      console.error(`Bridge error in ${context}:`, error);
      
      const isBridgeError = this.isBridgeRelatedError(error);
      const isAlignmentError = this.isAlignmentRelatedError(error);
      
      if (isBridgeError || isAlignmentError) {
        console.warn(`${isAlignmentError ? 'Alignment' : 'Bridge'} error detected in ${context}, returning fallback value`);
        
        // Trigger memory cleanup for alignment errors
        if (isAlignmentError) {
          memoryProtection.performMemoryCheck();
        }
        
        return fallbackValue ?? null;
      }
      
      // Re-throw non-bridge errors
      throw error;
    }
  }

  /**
   * Checks if an error is likely related to React Native bridge issues
   */
  private static isBridgeRelatedError(error: any): boolean {
    if (!error) return false;
    
    const errorString = error.toString().toLowerCase();
    const stackString = error.stack?.toLowerCase() || '';
    
    // Enhanced detection for specific crash patterns from the crash report
    const bridgePatterns = [
      'rctexceptionsmanager',
      'facebook::react::invokeinne',
      'rctmodulemethd',
      'rctbridge',
      'rctnativemodule',
      'turbomodule',
      'convertnsarraytojsiarray',
      'exc_bad_access',
      'sigabrt',
      'objc_exception_throw',
      'rctfatal',
      'bridge',
      'native module',
      'jsi',
      'hermes',
      'rct',
      // iOS-specific patterns from the crash report
      'pthread_kill',
      'abort',
      '__abort_message',
      'demangling_terminate_handler',
      '_objc_terminate',
      'objc_exception_rethrow',
      // Memory alignment patterns
      'alignment',
      'pc alignment',
      'esr: 0x56000080'
    ];
    
    return bridgePatterns.some(pattern => 
      errorString.includes(pattern) || stackString.includes(pattern)
    );
  }

  /**
   * Enhanced alignment error detection for iOS crashes
   */
  private static isAlignmentRelatedError(error: any): boolean {
    if (!error) return false;
    
    const errorString = error.toString().toLowerCase();
    const stackString = error.stack?.toLowerCase() || '';
    
    // Specific patterns from iOS crash reports
    const alignmentPatterns = [
      'alignment',
      'pc alignment',
      'esr: 0x56000080',
      'exc_bad_access',
      'sigabrt',
      'pthread_kill',
      'abort',
      '__abort_message',
      'memory',
      'stack overflow',
      'heap corruption',
      // iOS-specific memory errors
      'mach_msg',
      'objc_exception',
      'libc++abi',
      'std::terminate'
    ];
    
    return alignmentPatterns.some(pattern => 
      errorString.includes(pattern) || stackString.includes(pattern)
    );
  }

  /**
   * Wraps promise rejection to prevent uncaught promise rejections
   */
  static async safePromise<T>(
    promise: Promise<T>,
    context: string,
    fallbackValue?: T
  ): Promise<T | null> {
    return this.wrapAsyncCall(() => promise, context, fallbackValue);
  }

  /**
   * Creates a safe timeout wrapper for async operations
   */
  static async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number = 5000,
    context: string = 'operation'
  ): Promise<T | null> {
    return this.wrapAsyncCall(async () => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
      });
      
      return Promise.race([fn(), timeoutPromise]);
    }, context);
  }
}

/**
 * Safe utility for React Native AsyncStorage operations
 */
export class SafeAsyncStorage {
  static async getItem(key: string): Promise<string | null> {
    return BridgeErrorHandler.wrapAsyncCall(
      async () => {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        return AsyncStorage.getItem(key);
      },
      `AsyncStorage.getItem(${key})`
    );
  }

  static async setItem(key: string, value: string): Promise<boolean> {
    const result = await BridgeErrorHandler.wrapAsyncCall(
      async () => {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.setItem(key, value);
        return true;
      },
      `AsyncStorage.setItem(${key})`,
      false
    );
    
    return result === true;
  }

  static async removeItem(key: string): Promise<boolean> {
    const result = await BridgeErrorHandler.wrapAsyncCall(
      async () => {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.removeItem(key);
        return true;
      },
      `AsyncStorage.removeItem(${key})`,
      false
    );
    
    return result === true;
  }
}