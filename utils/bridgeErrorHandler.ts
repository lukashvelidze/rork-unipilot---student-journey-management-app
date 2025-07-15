/**
 * Bridge Error Handler Utility
 * Prevents React Native bridge crashes by safely wrapping async operations
 */

export class BridgeErrorHandler {
  /**
   * Safely wraps async function calls that might cause bridge exceptions
   */
  static async wrapAsyncCall<T>(
    fn: () => Promise<T>,
    context: string,
    fallbackValue?: T
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      console.error(`Bridge error in ${context}:`, error);
      
      // Check if this looks like a bridge-related error
      const isBridgeError = this.isBridgeRelatedError(error);
      
      if (isBridgeError) {
        console.warn(`Bridge error detected in ${context}, returning fallback value`);
        return fallbackValue ?? null;
      }
      
      // Re-throw non-bridge errors
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
    try {
      return fn();
    } catch (error) {
      console.error(`Bridge error in ${context}:`, error);
      
      const isBridgeError = this.isBridgeRelatedError(error);
      
      if (isBridgeError) {
        console.warn(`Bridge error detected in ${context}, returning fallback value`);
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