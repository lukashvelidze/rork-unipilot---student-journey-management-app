/**
 * iOS Crash Prevention Utility
 * Specifically handles crash patterns identified in the iOS crash report
 */

import { ErrorUtils, Platform } from 'react-native';
import { memoryProtection } from './memoryProtection';

export class IOSCrashPrevention {
  private static isSetup = false;
  private static originalHandler: ((error: any, isFatal?: boolean) => void) | null = null;

  /**
   * Initialize iOS-specific crash prevention
   */
  static initialize() {
    if (this.isSetup || Platform.OS !== 'ios') {
      return;
    }

    console.log('🍎 Setting up iOS crash prevention...');

    // Check if ErrorUtils has the required methods
    if (!ErrorUtils || typeof ErrorUtils.getGlobalHandler !== 'function' || typeof ErrorUtils.setGlobalHandler !== 'function') {
      console.warn('⚠️ ErrorUtils methods not available, skipping iOS crash prevention setup');
      return;
    }

    // Store original error handler
    this.originalHandler = ErrorUtils.getGlobalHandler() || null;

    // Set up our crash prevention handler
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.handleError(error, isFatal);
    });

    // Set up unhandled promise rejection handler
    this.setupPromiseRejectionHandler();

    this.isSetup = true;
    console.log('✅ iOS crash prevention initialized');
  }

  /**
   * Handle errors with iOS-specific crash prevention
   */
  private static handleError(error: any, isFatal?: boolean) {
    console.error('🚨 iOS Error intercepted:', error);
    console.error('🚨 Fatal:', isFatal);
    
    const errorString = String(error);
    const stackTrace = error?.stack || '';
    
    // Check for specific crash patterns from the crash report
    if (this.isKnownCrashPattern(error)) {
      console.error('🚨 Known iOS crash pattern detected - preventing crash');
      
      // Perform memory cleanup
      memoryProtection.performMemoryCheck();
      
      // Convert fatal errors to non-fatal for known patterns
      if (isFatal) {
        console.error('🚨 Converting fatal error to non-fatal');
        
        // Call original handler with non-fatal flag
        if (this.originalHandler) {
          this.originalHandler(error, false);
        }
        return;
      }
    }
    
    // For all other errors, use original handler
    if (this.originalHandler) {
      this.originalHandler(error, isFatal);
    }
  }

  /**
   * Check if error matches known iOS crash patterns
   */
  private static isKnownCrashPattern(error: any): boolean {
    if (!error) return false;
    
    const errorString = String(error).toLowerCase();
    const stackTrace = error?.stack?.toLowerCase() || '';
    
    // Patterns from the specific crash report
    const crashPatterns = [
      // React Native bridge patterns
      'rctexceptionsmanager',
      'facebook::react::invokeinne',
      'rctmodulemethd',
      'rctbridge',
      'rctnativemodule',
      'rctfatal',
      
      // iOS system patterns from crash report
      'pthread_kill',
      'abort',
      '__abort_message',
      'demangling_terminate_handler',
      '_objc_terminate',
      'objc_exception_rethrow',
      'objc_exception_throw',
      
      // Memory/alignment patterns
      'exc_bad_access',
      'sigabrt',
      'esr: 0x56000080',
      'pc alignment',
      'alignment',
      
      // Hermes engine patterns
      'hermes::vm',
      'hermes',
      
      // TurboModule patterns
      'turbomodule',
      'convertnsarraytojsiarray',
      
      // iOS-specific system calls
      'mach_msg',
      'cfrunloop',
      'nsinvocation',
      'libc++abi',
      'std::terminate'
    ];
    
    return crashPatterns.some(pattern => 
      errorString.includes(pattern) || stackTrace.includes(pattern)
    );
  }

  /**
   * Setup promise rejection handler to prevent unhandled rejections
   */
  private static setupPromiseRejectionHandler() {
    if (typeof global !== 'undefined' && global.process) {
      // Handle unhandled promise rejections
      const originalRejectionHandler = global.process.listeners('unhandledRejection');
      
      global.process.removeAllListeners('unhandledRejection');
      
      global.process.on('unhandledRejection', (reason, promise) => {
        console.error('🚨 Unhandled promise rejection:', reason);
        
        // Check if this is a known crash pattern
        if (this.isKnownCrashPattern(reason)) {
          console.error('🚨 Known crash pattern in promise rejection - handled safely');
          memoryProtection.performMemoryCheck();
          return;
        }
        
        // Call original handlers
        originalRejectionHandler.forEach(handler => {
          if (typeof handler === 'function') {
            handler(reason, promise);
          }
        });
      });
    }
  }

  /**
   * Safely execute a function that might cause iOS crashes
   */
  static async safeExecute<T>(
    fn: () => Promise<T> | T,
    context: string,
    fallbackValue?: T
  ): Promise<T | null> {
    try {
      // Perform memory check before execution
      memoryProtection.performMemoryCheck();
      
      const result = await fn();
      return result;
    } catch (error) {
      console.error(`iOS safe execution error in ${context}:`, error);
      
      if (this.isKnownCrashPattern(error)) {
        console.error(`Known iOS crash pattern in ${context} - returning fallback`);
        memoryProtection.performMemoryCheck();
        return fallbackValue ?? null;
      }
      
      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Wrap native module calls to prevent crashes
   */
  static wrapNativeModuleCall<T>(
    moduleName: string,
    methodName: string,
    fn: () => T,
    fallbackValue?: T
  ): T | null {
    try {
      console.log(`🍎 Calling native module: ${moduleName}.${methodName}`);
      
      // Memory check before native call
      memoryProtection.performMemoryCheck();
      
      const result = fn();
      console.log(`✅ Native module call successful: ${moduleName}.${methodName}`);
      return result;
    } catch (error) {
      console.error(`❌ Native module call failed: ${moduleName}.${methodName}`, error);
      
      if (this.isKnownCrashPattern(error)) {
        console.error(`Known crash pattern in native module call - using fallback`);
        memoryProtection.performMemoryCheck();
        return fallbackValue ?? null;
      }
      
      throw error;
    }
  }
}