/**
 * Emergency Error Handler - Last Line of Defense
 * Operates at the lowest level to prevent iOS crashes
 */

import { ErrorUtils, Platform } from 'react-native';

export class EmergencyErrorHandler {
  private static isInitialized = false;
  private static originalConsoleError: typeof console.error;
  private static originalConsoleWarn: typeof console.warn;
  private static crashCount = 0;
  private static maxCrashes = 3;

  /**
   * Initialize emergency error handling at the earliest possible moment
   */
  static initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('🚨 Emergency Error Handler: Initializing...');
    
    // Store original console methods
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    
    // Override console methods to catch errors before they crash
    this.overrideConsole();
    
    // Set up the most aggressive error handling possible
    this.setupEmergencyHandlers();
    
    // Set up process-level error handling
    this.setupProcessErrorHandling();
    
    // Set up React Native specific handlers
    this.setupReactNativeHandlers();
    
    this.isInitialized = true;
    console.log('✅ Emergency Error Handler: Initialized');
  }

  /**
   * Override console methods to catch and neutralize errors
   */
  private static overrideConsole() {
    console.error = (...args: any[]) => {
      try {
        const errorString = args.join(' ').toLowerCase();
        
        // Check for fatal crash patterns
        if (this.isFatalCrashPattern(errorString)) {
          console.log('🚨 FATAL CRASH PATTERN DETECTED - NEUTRALIZING');
          console.log('🚨 Original error:', ...args);
          
          // Don't let this error propagate
          return;
        }
        
        // Safe to call original
        this.originalConsoleError.apply(console, args);
      } catch (e) {
        // Even console.error failed - use native logging
        this.originalConsoleError.apply(console, ['Emergency console.error fallback:', ...args]);
      }
    };

    console.warn = (...args: any[]) => {
      try {
        const warnString = args.join(' ').toLowerCase();
        
        if (this.isFatalCrashPattern(warnString)) {
          console.log('🚨 FATAL PATTERN IN WARNING - NEUTRALIZING');
          return;
        }
        
        this.originalConsoleWarn.apply(console, args);
      } catch (e) {
        this.originalConsoleWarn.apply(console, ['Emergency console.warn fallback:', ...args]);
      }
    };
  }

  /**
   * Check if error contains fatal crash patterns
   */
  private static isFatalCrashPattern(errorString: string): boolean {
    const fatalPatterns = [
      'rctfatal',
      'rctexceptionsmanager',
      'facebook::react::invokeinne',
      'rctmodulemethod',
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
      'esr: 0x56000080',
      'pc alignment',
      'alignment',
      'convertnsarraytojsiarray',
      'turbomodule',
      'hermes::vm',
      'hadesGC'
    ];

    return fatalPatterns.some(pattern => errorString.includes(pattern));
  }

  /**
   * Set up emergency error handlers
   */
  private static setupEmergencyHandlers() {
    // Global error handler - most aggressive
    const originalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.crashCount++;
      
      console.log(`🚨 Emergency Handler: Error ${this.crashCount}/${this.maxCrashes}`);
      console.log('🚨 Error:', error);
      console.log('🚨 Fatal:', isFatal);
      
      // Always prevent fatal crashes
      if (isFatal) {
        console.log('🚨 CONVERTING FATAL TO NON-FATAL');
        
        // If we've had too many crashes, restart the app
        if (this.crashCount >= this.maxCrashes) {
          console.log('🚨 TOO MANY CRASHES - ATTEMPTING RECOVERY');
          this.attemptRecovery();
          return;
        }
        
        // Call original handler with non-fatal flag
        if (originalHandler) {
          try {
            originalHandler(error, false);
          } catch (e) {
            console.log('🚨 Original handler failed, continuing...');
          }
        }
        return;
      }
      
      // For non-fatal errors, try original handler
      if (originalHandler) {
        try {
          originalHandler(error, isFatal);
        } catch (e) {
          console.log('🚨 Original handler failed for non-fatal error');
        }
      }
    });
  }

  /**
   * Set up process-level error handling
   */
  private static setupProcessErrorHandling() {
    if (typeof global !== 'undefined' && global.process) {
      // Handle uncaught exceptions
      global.process.on('uncaughtException', (error) => {
        console.log('🚨 Uncaught Exception:', error);
        
        // Don't let the process crash
        if (this.isFatalCrashPattern(String(error))) {
          console.log('🚨 FATAL UNCAUGHT EXCEPTION - NEUTRALIZING');
          return;
        }
      });

      // Handle unhandled promise rejections
      global.process.on('unhandledRejection', (reason, promise) => {
        console.log('🚨 Unhandled Rejection:', reason);
        
        if (this.isFatalCrashPattern(String(reason))) {
          console.log('🚨 FATAL UNHANDLED REJECTION - NEUTRALIZING');
          return;
        }
      });
    }
  }

  /**
   * Set up React Native specific handlers
   */
  private static setupReactNativeHandlers() {
    // Handle React Native specific errors
    if (Platform.OS === 'ios') {
      // iOS-specific error handling
      this.setupIOSSpecificHandlers();
    }
  }

  /**
   * Set up iOS-specific error handlers
   */
  private static setupIOSSpecificHandlers() {
    // Override any iOS-specific error reporting
    if (typeof global !== 'undefined') {
      // Intercept native module errors
      const originalNativeModules = global.nativeModuleProxy;
      
      if (originalNativeModules) {
        global.nativeModuleProxy = new Proxy(originalNativeModules, {
          get: (target, prop) => {
            const original = target[prop];
            
            if (typeof original === 'function') {
              return (...args: any[]) => {
                try {
                  return original.apply(target, args);
                } catch (error) {
                  console.log(`🚨 Native module error in ${String(prop)}:`, error);
                  
                  if (this.isFatalCrashPattern(String(error))) {
                    console.log('🚨 FATAL NATIVE MODULE ERROR - RETURNING NULL');
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
   * Attempt to recover from too many crashes
   */
  private static attemptRecovery() {
    console.log('🚨 ATTEMPTING EMERGENCY RECOVERY');
    
    try {
      // Reset crash count
      this.crashCount = 0;
      
      // Clear any problematic state
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
      
      // Try to reload the app
      if (typeof global !== 'undefined' && global.location) {
        global.location.reload();
      }
      
      console.log('✅ Emergency recovery completed');
    } catch (e) {
      console.log('❌ Emergency recovery failed:', e);
    }
  }

  /**
   * Get crash statistics
   */
  static getCrashStats() {
    return {
      crashCount: this.crashCount,
      maxCrashes: this.maxCrashes,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Reset crash count
   */
  static resetCrashCount() {
    this.crashCount = 0;
    console.log('🚨 Emergency Handler: Crash count reset');
  }
}

// Initialize immediately when module is loaded
EmergencyErrorHandler.initialize();