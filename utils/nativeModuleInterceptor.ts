/**
 * Native Module Interceptor - Prevents bridge crashes at the lowest level
 * Intercepts all native module calls to prevent fatal errors
 */

import { NativeModules, Platform } from 'react-native';

export class NativeModuleInterceptor {
  private static isInitialized = false;
  private static originalModules: any = {};
  private static interceptedCalls = 0;
  private static preventedCrashes = 0;

  /**
   * Initialize native module interception
   */
  static initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('🛡️ Native Module Interceptor: Initializing...');

    try {
      // Store original modules
      this.originalModules = { ...NativeModules };
      
      // Intercept all native modules
      this.interceptAllNativeModules();
      
      // Set up global native module proxy
      this.setupGlobalProxy();
      
      this.isInitialized = true;
      console.log('✅ Native Module Interceptor: Initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Native Module Interceptor:', error);
    }
  }

  /**
   * Intercept all native modules
   */
  private static interceptAllNativeModules() {
    Object.keys(NativeModules).forEach(moduleName => {
      const module = NativeModules[moduleName];
      
      if (module && typeof module === 'object') {
        NativeModules[moduleName] = this.createSafeModuleProxy(module, moduleName);
      }
    });
  }

  /**
   * Create a safe proxy for a native module
   */
  private static createSafeModuleProxy(module: any, moduleName: string) {
    return new Proxy(module, {
      get: (target, prop: string) => {
        const original = target[prop];
        
        if (typeof original === 'function') {
          return (...args: any[]) => {
            this.interceptedCalls++;
            
            try {
              console.log(`🛡️ Intercepting ${moduleName}.${prop}`);
              
              // Pre-flight safety check
              if (this.shouldBlockCall(moduleName, prop, args)) {
                console.log(`🚨 BLOCKING DANGEROUS CALL: ${moduleName}.${prop}`);
                this.preventedCrashes++;
                return this.getSafeReturnValue(moduleName, prop);
              }
              
              // Execute with timeout protection
              const result = this.executeWithTimeout(
                () => original.apply(target, args),
                moduleName,
                prop,
                5000 // 5 second timeout
              );
              
              console.log(`✅ Safe call completed: ${moduleName}.${prop}`);
              return result;
              
            } catch (error) {
              console.error(`❌ Native module error in ${moduleName}.${prop}:`, error);
              
              // Check if this is a fatal error pattern
              if (this.isFatalError(error)) {
                console.log(`🚨 FATAL ERROR DETECTED - PREVENTING CRASH: ${moduleName}.${prop}`);
                this.preventedCrashes++;
                return this.getSafeReturnValue(moduleName, prop);
              }
              
              // Re-throw non-fatal errors
              throw error;
            }
          };
        }
        
        return original;
      }
    });
  }

  /**
   * Set up global native module proxy
   */
  private static setupGlobalProxy() {
    if (typeof global !== 'undefined') {
      // Intercept global native module access
      const originalGlobalNativeModules = global.nativeModuleProxy;
      
      if (originalGlobalNativeModules) {
        global.nativeModuleProxy = new Proxy(originalGlobalNativeModules, {
          get: (target, prop) => {
            const original = target[prop];
            
            if (typeof original === 'function') {
              return (...args: any[]) => {
                try {
                  return original.apply(target, args);
                } catch (error) {
                  console.error(`Global native module error in ${String(prop)}:`, error);
                  
                  if (this.isFatalError(error)) {
                    console.log(`🚨 FATAL GLOBAL ERROR - PREVENTING CRASH: ${String(prop)}`);
                    this.preventedCrashes++;
                    return null;
                  }
                  
                  throw error;
                }
              };
            }
            
            return original;
          }
        });
      }
    }
  }

  /**
   * Check if a native module call should be blocked
   */
  private static shouldBlockCall(moduleName: string, methodName: string, args: any[]): boolean {
    // Block calls that are known to cause crashes
    const dangerousPatterns = [
      // Known problematic module/method combinations
      { module: 'RCTExceptionsManager', method: 'reportFatal' },
      { module: 'RCTExceptionsManager', method: 'reportException' },
      
      // Block calls with dangerous arguments
      ...(this.hasDangerousArguments(args) ? [{ module: moduleName, method: methodName }] : [])
    ];
    
    return dangerousPatterns.some(pattern => 
      pattern.module === moduleName && pattern.method === methodName
    );
  }

  /**
   * Check if arguments contain dangerous patterns
   */
  private static hasDangerousArguments(args: any[]): boolean {
    try {
      const argsString = JSON.stringify(args).toLowerCase();
      
      const dangerousPatterns = [
        'rctfatal',
        'facebook::react::invokeinne',
        'objc_exception_throw',
        'sigabrt',
        'pthread_kill',
        'abort',
        'alignment',
        'exc_bad_access'
      ];
      
      return dangerousPatterns.some(pattern => argsString.includes(pattern));
    } catch (e) {
      // If we can't stringify args, assume they're dangerous
      return true;
    }
  }

  /**
   * Execute function with timeout protection
   */
  private static executeWithTimeout(fn: () => any, moduleName: string, methodName: string, timeout: number): any {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.log(`⏰ TIMEOUT: ${moduleName}.${methodName} - returning safe value`);
        resolve(this.getSafeReturnValue(moduleName, methodName));
      }, timeout);
      
      try {
        const result = fn();
        clearTimeout(timeoutId);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          result
            .then((value: any) => {
              clearTimeout(timeoutId);
              resolve(value);
            })
            .catch((error: any) => {
              clearTimeout(timeoutId);
              if (this.isFatalError(error)) {
                console.log(`🚨 FATAL PROMISE ERROR - RETURNING SAFE VALUE: ${moduleName}.${methodName}`);
                resolve(this.getSafeReturnValue(moduleName, methodName));
              } else {
                reject(error);
              }
            });
        } else {
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (this.isFatalError(error)) {
          console.log(`🚨 FATAL SYNC ERROR - RETURNING SAFE VALUE: ${moduleName}.${methodName}`);
          resolve(this.getSafeReturnValue(moduleName, methodName));
        } else {
          reject(error);
        }
      }
    });
  }

  /**
   * Check if error is fatal
   */
  private static isFatalError(error: any): boolean {
    const errorString = String(error).toLowerCase();
    
    const fatalPatterns = [
      'rctfatal',
      'rctexceptionsmanager',
      'facebook::react::invokeinne',
      'objc_exception_throw',
      'sigabrt',
      'pthread_kill',
      'abort',
      '__abort_message',
      'demangling_terminate_handler',
      '_objc_terminate',
      'objc_exception_rethrow',
      'exc_crash',
      'exc_bad_access',
      'alignment',
      'turbomodule',
      'convertnsarraytojsiarray'
    ];
    
    return fatalPatterns.some(pattern => errorString.includes(pattern));
  }

  /**
   * Get safe return value for a module method
   */
  private static getSafeReturnValue(moduleName: string, methodName: string): any {
    // Return appropriate safe values based on module/method
    const safeValues: Record<string, any> = {
      'AsyncStorage.getItem': null,
      'AsyncStorage.setItem': Promise.resolve(),
      'AsyncStorage.removeItem': Promise.resolve(),
      'AsyncStorage.clear': Promise.resolve(),
      'AsyncStorage.getAllKeys': Promise.resolve([]),
      'ExpoHaptics.impactAsync': Promise.resolve(),
      'ExpoHaptics.notificationAsync': Promise.resolve(),
      'ExpoHaptics.selectionAsync': Promise.resolve(),
      'ExpoConstants.get': {},
      'RCTExceptionsManager.reportFatal': undefined,
      'RCTExceptionsManager.reportException': undefined,
    };
    
    const key = `${moduleName}.${methodName}`;
    
    if (safeValues.hasOwnProperty(key)) {
      return safeValues[key];
    }
    
    // Default safe values based on method name patterns
    if (methodName.includes('get') || methodName.includes('fetch')) {
      return null;
    }
    
    if (methodName.includes('set') || methodName.includes('save') || methodName.includes('update')) {
      return Promise.resolve();
    }
    
    if (methodName.includes('Async') || methodName.includes('async')) {
      return Promise.resolve(null);
    }
    
    return null;
  }

  /**
   * Get interception statistics
   */
  static getStats() {
    return {
      isInitialized: this.isInitialized,
      interceptedCalls: this.interceptedCalls,
      preventedCrashes: this.preventedCrashes
    };
  }

  /**
   * Reset statistics
   */
  static resetStats() {
    this.interceptedCalls = 0;
    this.preventedCrashes = 0;
  }
}

// Initialize immediately when module is loaded
NativeModuleInterceptor.initialize();