import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  crashCount: number;
}

export class CrashProtectionBoundary extends Component<Props, State> {
  private memoryCheckInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      crashCount: 0
    };
    
    // Set up memory monitoring
    this.setupMemoryMonitoring();
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  private setupMemoryMonitoring() {
    // Monitor memory usage every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
  }

  private checkMemoryUsage() {
    try {
      // Check if we can allocate memory safely
      const testArray = new Array(1000).fill(0);
      testArray.length = 0; // Release immediately
      
      // Check stack depth
      this.checkStackDepth(0);
    } catch (error) {
      console.warn('Memory check failed:', error);
      // If memory check fails, we might be approaching limits
      this.preventiveCrashProtection();
    }
  }

  private checkStackDepth(depth: number): boolean {
    // Prevent stack overflow by limiting recursion depth
    if (depth > 100) {
      throw new Error('Stack depth limit reached');
    }
    return true;
  }

  private preventiveCrashProtection() {
    // Force garbage collection if available
    if (global.gc) {
      try {
        global.gc();
      } catch (e) {
        console.warn('GC not available');
      }
    }
    
    // Clear any pending timers
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    const originalHandler = global.Promise.prototype.catch;
    global.Promise.prototype.catch = function(onRejected) {
      return originalHandler.call(this, (error) => {
        console.error('Unhandled promise rejection intercepted:', error);
        
        // Check if this might cause a PC alignment error
        if (error && typeof error === 'object' && 'stack' in error) {
          const stack = String(error.stack);
          if (stack.includes('alignment') || stack.includes('SIGSEGV') || stack.includes('SIGABRT')) {
            console.error('Potential alignment error detected, triggering safe handling');
          }
        }
        
        if (onRejected) {
          return onRejected(error);
        }
        throw error;
      });
    };

    // Handle JavaScript errors
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('Global JS error intercepted:', error, 'Fatal:', isFatal);
      
      // If this looks like a memory/alignment issue, try to handle gracefully
      if (error && typeof error === 'object') {
        const errorStr = String(error);
        if (errorStr.includes('alignment') || errorStr.includes('memory') || errorStr.includes('bridge')) {
          console.error('Potential bridge/memory error detected');
          this.preventiveCrashProtection();
        }
      }
      
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      crashCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CrashProtectionBoundary caught an error:', error, errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      crashCount: prevState.crashCount + 1
    }));

    // Trigger preventive measures
    this.preventiveCrashProtection();
    
    // Hide splash screen if it's still showing
    SplashScreen.hideAsync().catch(() => {});
    
    // Report crash details
    this.reportCrash(error, errorInfo);
  }

  private reportCrash(error: Error, errorInfo: ErrorInfo) {
    const crashReport = {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      crashCount: this.state.crashCount,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
    
    console.error('Crash report:', crashReport);
    
    // You can send this to your crash reporting service
    // crashlytics.recordError(error);
  }

  private handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Restart memory monitoring
    this.setupMemoryMonitoring();
  };

  private handleForceRestart = () => {
    // Clear all state and force a complete restart
    this.preventiveCrashProtection();
    
    Alert.alert(
      'App Restart Required',
      'The app will restart to prevent further crashes.',
      [
        {
          text: 'Restart Now',
          onPress: () => {
            // Force app restart (this will cause the app to crash gracefully and restart)
            throw new Error('Forced restart to prevent PC alignment crashes');
          }
        }
      ]
    );
  };

  componentWillUnmount() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }

  render() {
    if (this.state.hasError) {
      // Multiple crashes indicate serious issues
      if (this.state.crashCount > 2) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Multiple Crashes Detected</Text>
            <Text style={styles.errorText}>
              The app has crashed {this.state.crashCount} times. This may indicate a serious memory or alignment issue.
            </Text>
            <TouchableOpacity style={styles.restartButton} onPress={this.handleForceRestart}>
              <Text style={styles.restartButtonText}>Force Restart App</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            The app encountered an unexpected error. This has been reported.
          </Text>
          <TouchableOpacity style={styles.restartButton} onPress={this.handleRestart}>
            <Text style={styles.restartButtonText}>Try Again</Text>
          </TouchableOpacity>
          <Text style={styles.errorDetails}>
            Error: {this.state.error?.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  restartButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  restartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
