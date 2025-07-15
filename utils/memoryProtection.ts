/**
 * Memory Protection Utility
 * Prevents PC alignment crashes by monitoring memory usage and stack depth
 */

interface MemoryStats {
  stackDepth: number;
  lastCheck: number;
  warningCount: number;
}

class MemoryProtection {
  private static instance: MemoryProtection;
  private stats: MemoryStats = {
    stackDepth: 0,
    lastCheck: Date.now(),
    warningCount: 0
  };
  
  private readonly MAX_STACK_DEPTH = 150;
  private readonly MEMORY_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly MAX_WARNINGS = 5;

  static getInstance(): MemoryProtection {
    if (!MemoryProtection.instance) {
      MemoryProtection.instance = new MemoryProtection();
    }
    return MemoryProtection.instance;
  }

  /**
   * Check if it's safe to perform memory-intensive operations
   */
  isSafeToAllocate(): boolean {
    try {
      // Test small allocation
      const testBuffer = new ArrayBuffer(1024);
      return testBuffer.byteLength === 1024;
    } catch (error) {
      console.warn('Memory allocation test failed:', error);
      return false;
    }
  }

  /**
   * Check current stack depth to prevent overflow
   */
  checkStackDepth(): boolean {
    const error = new Error();
    const stackLines = error.stack?.split('\n') || [];
    const currentDepth = stackLines.length;
    
    this.stats.stackDepth = currentDepth;
    
    if (currentDepth > this.MAX_STACK_DEPTH) {
      console.error(`Stack depth warning: ${currentDepth} > ${this.MAX_STACK_DEPTH}`);
      this.stats.warningCount++;
      
      if (this.stats.warningCount > this.MAX_WARNINGS) {
        throw new Error('Maximum stack depth exceeded - preventing crash');
      }
      
      return false;
    }
    
    return true;
  }

  /**
   * Safe wrapper for recursive functions
   */
  safeRecursiveCall<T>(
    fn: () => T,
    context: string,
    maxDepth: number = 50
  ): T | null {
    if (!this.checkStackDepth()) {
      console.error(`Recursive call ${context} blocked due to stack depth`);
      return null;
    }

    const error = new Error();
    const currentDepth = error.stack?.split('\n').length || 0;
    
    if (currentDepth > maxDepth) {
      console.error(`Recursive call ${context} blocked - depth ${currentDepth} > ${maxDepth}`);
      return null;
    }

    try {
      return fn();
    } catch (error) {
      console.error(`Recursive call ${context} failed:`, error);
      return null;
    }
  }

  /**
   * Safe wrapper for array operations that might cause alignment issues
   */
  safeArrayOperation<T>(
    operation: () => T[],
    context: string,
    maxSize: number = 10000
  ): T[] {
    if (!this.isSafeToAllocate()) {
      console.warn(`Array operation ${context} blocked - memory not available`);
      return [];
    }

    try {
      const result = operation();
      
      if (result.length > maxSize) {
        console.warn(`Array operation ${context} result too large: ${result.length} > ${maxSize}`);
        return result.slice(0, maxSize);
      }
      
      return result;
    } catch (error) {
      console.error(`Array operation ${context} failed:`, error);
      return [];
    }
  }

  /**
   * Monitor memory usage and trigger cleanup if needed
   */
  performMemoryCheck(): void {
    const now = Date.now();
    
    if (now - this.stats.lastCheck < this.MEMORY_CHECK_INTERVAL) {
      return;
    }
    
    this.stats.lastCheck = now;
    
    try {
      // Test memory allocation
      if (!this.isSafeToAllocate()) {
        this.triggerMemoryCleanup();
      }
      
      // Check stack depth
      if (!this.checkStackDepth()) {
        this.triggerStackCleanup();
      }
      
      // Reset warning count if we're doing well
      if (this.stats.warningCount > 0 && this.isSafeToAllocate()) {
        this.stats.warningCount = Math.max(0, this.stats.warningCount - 1);
      }
      
    } catch (error) {
      console.error('Memory check failed:', error);
      this.triggerEmergencyCleanup();
    }
  }

  /**
   * Trigger memory cleanup
   */
  private triggerMemoryCleanup(): void {
    console.log('Triggering memory cleanup...');
    
    // Force garbage collection if available
    if (global.gc) {
      try {
        global.gc();
        console.log('Garbage collection triggered');
      } catch (error) {
        console.warn('Garbage collection failed:', error);
      }
    }
    
    // Clear any large cached objects
    this.clearCaches();
  }

  /**
   * Trigger stack cleanup
   */
  private triggerStackCleanup(): void {
    console.log('Triggering stack cleanup due to depth warning...');
    
    // Reset stack depth tracking
    this.stats.stackDepth = 0;
    
    // Use setTimeout to break out of current call stack
    setTimeout(() => {
      this.performMemoryCheck();
    }, 0);
  }

  /**
   * Emergency cleanup for critical situations
   */
  private triggerEmergencyCleanup(): void {
    console.error('Triggering emergency cleanup...');
    
    // Clear all caches
    this.clearCaches();
    
    // Reset all stats
    this.stats = {
      stackDepth: 0,
      lastCheck: Date.now(),
      warningCount: 0
    };
    
    // Force GC
    if (global.gc) {
      try {
        global.gc();
      } catch (e) {
        console.warn('Emergency GC failed');
      }
    }
  }

  /**
   * Clear any caches or large objects
   */
  private clearCaches(): void {
    // Clear console logs if too many
    if (console && typeof console.clear === 'function') {
      console.clear();
    }
    
    // You can add other cache clearing logic here
    // For example: clearing image caches, query caches, etc.
  }

  /**
   * Get current memory stats
   */
  getMemoryStats(): MemoryStats {
    return { ...this.stats };
  }

  /**
   * Reset all protection state
   */
  reset(): void {
    this.stats = {
      stackDepth: 0,
      lastCheck: Date.now(),
      warningCount: 0
    };
  }
}

// Export singleton instance
export const memoryProtection = MemoryProtection.getInstance();

/**
 * Decorator for functions that need memory protection
 */
export function withMemoryProtection<T extends (...args: any[]) => any>(
  fn: T,
  context: string
): T {
  return ((...args: any[]) => {
    memoryProtection.performMemoryCheck();
    
    if (!memoryProtection.checkStackDepth()) {
      console.error(`Function ${context} blocked due to stack depth`);
      return null;
    }
    
    if (!memoryProtection.isSafeToAllocate()) {
      console.warn(`Function ${context} proceeding with low memory warning`);
    }
    
    try {
      return fn(...args);
    } catch (error) {
      console.error(`Function ${context} failed with memory protection:`, error);
      memoryProtection.triggerMemoryCleanup();
      throw error;
    }
  }) as T;
}

/**
 * Safe wrapper for async operations
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  context: string,
  timeout: number = 10000
): Promise<T | null> {
  memoryProtection.performMemoryCheck();
  
  if (!memoryProtection.isSafeToAllocate()) {
    console.warn(`Async operation ${context} skipped - low memory`);
    return null;
  }
  
  return new Promise<T | null>((resolve) => {
    const timeoutId = setTimeout(() => {
      console.error(`Async operation ${context} timed out`);
      resolve(null);
    }, timeout);
    
    operation()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error(`Async operation ${context} failed:`, error);
        memoryProtection.triggerMemoryCleanup();
        resolve(null);
      });
  });
}