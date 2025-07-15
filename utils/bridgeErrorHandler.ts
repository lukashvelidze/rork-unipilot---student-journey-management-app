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
    
    const bridgeKeywords = [
      'turbomodule',
      'jsi',
      'rct',
      'objc_exception',
      'nsinvocation',
      'convertnsarraytojsiarray',
      'rnbridge',
      'react native',
      'rn',
      'facebook::react',
      'hermes::vm'
    ];
    
    return bridgeKeywords.some(keyword => 
      errorString.includes(keyword) || stackString.includes(keyword)
    );
  }

  /**
   * Checks if an error is likely related to PC alignment or memory issues
   */
  private static isAlignmentRelatedError(error: any): boolean {
    if (!error) return false;
    
    const errorString = error.toString().toLowerCase();
    const stackString = error.stack?.toLowerCase() || '';
    
    const alignmentKeywords = [
      'alignment',
      'pc alignment',
      'sigsegv',
      'sigabrt',
      'exc_bad_access',
      'exc_crash',
      'memory',
      'stack overflow',
      'buffer overflow',
      'heap',
      'malloc',
      'free',
      'corrupted',
      'invalid pointer',
      'segmentation fault',
      'bus error',
      'unaligned',
      'misaligned'
    ];
    
    // Check for specific ESR codes that indicate alignment errors
    const esrAlignmentCodes = [
      '0x56000080', // PC alignment
      '0x92000046', // Data abort
      '0x96000010'  // SP alignment
    ];
    
    const hasAlignmentKeyword = alignmentKeywords.some(keyword => 
      errorString.includes(keyword) || stackString.includes(keyword)
    );
    
    const hasESRCode = esrAlignmentCodes.some(code => 
      errorString.includes(code) || stackString.includes(code)
    );
    
    return hasAlignmentKeyword || hasESRCode;
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