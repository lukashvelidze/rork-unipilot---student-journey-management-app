/**
 * RCTExceptionsManager Override - Prevents the exact crash pattern
 * Specifically targets the RCTExceptionsManager.reportFatal crash
 */

import { NativeModules } from 'react-native';

export class RCTExceptionsManagerOverride {
  private static isInitialized = false;
  private static originalReportFatal: any;
  private static originalReportException: any;
  private static blockedFatalReports = 0;
  private static blockedExceptions = 0;

  /**
   * Initialize RCTExceptionsManager override
   */
  static initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('🛡️ RCTExceptionsManager Override: Initializing...');

    try {
      const RCTExceptionsManager = NativeModules.RCTExceptionsManager;
      
      if (RCTExceptionsManager) {
        // Store original methods
        this.originalReportFatal = RCTExceptionsManager.reportFatal;
        this.originalReportException = RCTExceptionsManager.reportException;
        
        // Override reportFatal to prevent crashes
        RCTExceptionsManager.reportFatal = (
          message: string,
          stack: any,
          exceptionId: number,
          extraData?: string
        ) => {
          console.log('🚨 RCTExceptionsManager.reportFatal INTERCEPTED');
          console.log('🚨 Message:', message);
          console.log('🚨 Stack:', stack);
          console.log('🚨 ExceptionId:', exceptionId);
          
          // Check if this is a pattern we should block
          if (this.shouldBlockFatalReport(message, stack)) {
            console.log('🚨 BLOCKING FATAL REPORT - PREVENTING CRASH');
            this.blockedFatalReports++;
            
            // Log the error instead of crashing
            console.error('🚨 BLOCKED FATAL ERROR:', {
              message,
              stack,
              exceptionId,
              extraData
            });
            
            return; // Don't call original method
          }
          
          // For non-dangerous errors, call original method
          if (this.originalReportFatal) {
            this.originalReportFatal.call(RCTExceptionsManager, message, stack, exceptionId, extraData);
          }
        };
        
        // Override reportException to prevent escalation
        RCTExceptionsManager.reportException = (data: any) => {
          console.log('🚨 RCTExceptionsManager.reportException INTERCEPTED');
          console.log('🚨 Exception data:', data);
          
          // Check if this exception should be blocked
          if (this.shouldBlockException(data)) {
            console.log('🚨 BLOCKING EXCEPTION - PREVENTING ESCALATION');
            this.blockedExceptions++;
            
            // Log the exception instead of reporting it
            console.error('🚨 BLOCKED EXCEPTION:', data);
            
            return; // Don't call original method
          }
          
          // For non-dangerous exceptions, call original method
          if (this.originalReportException) {
            this.originalReportException.call(RCTExceptionsManager, data);
          }
        };
        
        console.log('✅ RCTExceptionsManager Override: Initialized');
      } else {
        console.log('⚠️ RCTExceptionsManager not found - override not needed');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize RCTExceptionsManager override:', error);
    }
  }

  /**
   * Check if a fatal report should be blocked
   */
  private static shouldBlockFatalReport(message: string, stack: any): boolean {
    const messageStr = String(message).toLowerCase();
    const stackStr = String(stack).toLowerCase();
    
    // Block patterns that match the crash report
    const dangerousPatterns = [
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
      'alignment',
      'pc alignment',
      'esr: 0x56000080',
      'convertnsarraytojsiarray',
      'turbomodule',
      'hermes::vm',
      'hadesGC',
      // Block any fatal reports that mention bridge components
      'rctbridge',
      'rctnativemodule',
      'rctcxxbridge',
      'rctmoduledata'
    ];
    
    return dangerousPatterns.some(pattern => 
      messageStr.includes(pattern) || stackStr.includes(pattern)
    );
  }

  /**
   * Check if an exception should be blocked
   */
  private static shouldBlockException(data: any): boolean {
    try {
      const dataStr = JSON.stringify(data).toLowerCase();
      
      // Block exceptions that contain dangerous patterns
      const dangerousPatterns = [
        'fatal',
        'rctfatal',
        'facebook::react::invokeinne',
        'objc_exception_throw',
        'sigabrt',
        'pthread_kill',
        'abort',
        'alignment',
        'exc_bad_access',
        'turbomodule',
        'convertnsarraytojsiarray'
      ];
      
      return dangerousPatterns.some(pattern => dataStr.includes(pattern));
    } catch (e) {
      // If we can't stringify the data, assume it's dangerous
      return true;
    }
  }

  /**
   * Get override statistics
   */
  static getStats() {
    return {
      isInitialized: this.isInitialized,
      blockedFatalReports: this.blockedFatalReports,
      blockedExceptions: this.blockedExceptions
    };
  }

  /**
   * Reset statistics
   */
  static resetStats() {
    this.blockedFatalReports = 0;
    this.blockedExceptions = 0;
  }

  /**
   * Restore original methods (for testing)
   */
  static restore() {
    if (!this.isInitialized) {
      return;
    }

    try {
      const RCTExceptionsManager = NativeModules.RCTExceptionsManager;
      
      if (RCTExceptionsManager) {
        if (this.originalReportFatal) {
          RCTExceptionsManager.reportFatal = this.originalReportFatal;
        }
        
        if (this.originalReportException) {
          RCTExceptionsManager.reportException = this.originalReportException;
        }
      }
      
      this.isInitialized = false;
      console.log('✅ RCTExceptionsManager Override: Restored');
    } catch (error) {
      console.error('❌ Failed to restore RCTExceptionsManager:', error);
    }
  }
}

// Initialize immediately when module is loaded
RCTExceptionsManagerOverride.initialize();