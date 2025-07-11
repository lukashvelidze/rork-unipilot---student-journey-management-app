# Troubleshooting Guide

This guide helps you resolve common issues encountered while developing, building, or running UniPilot. Issues are organized by category and platform for easy navigation.

## 🚀 Development Setup Issues

### Node.js and Package Manager Issues

#### Problem: `npm install` fails with permission errors
```bash
Error: EACCES: permission denied, access '/usr/local/lib/node_modules'
```

**Solution:**
```bash
# Option 1: Use a Node version manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

#### Problem: Package installation hangs or is very slow
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Use different registry
npm install --registry https://registry.npmjs.org/

# Try using Yarn or Bun instead
npm install -g yarn
yarn install

# Or use Bun (fastest)
npm install -g bun
bun install
```

### Environment Configuration Issues

#### Problem: Environment variables not loading
```
Error: No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL
```

**Solution:**
```bash
# 1. Ensure .env.local exists in root directory
ls -la .env.local

# 2. Check environment variable format
cat .env.local
# Should contain:
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000

# 3. Restart development server
npm run start -- --clear
```

#### Problem: Paddle configuration errors
```
Error: Paddle not initialized
```

**Solution:**
```bash
# Check Paddle environment variables
echo $EXPO_PUBLIC_PADDLE_TOKEN
echo $EXPO_PUBLIC_PADDLE_ENVIRONMENT

# Ensure correct format in .env.local
EXPO_PUBLIC_PADDLE_TOKEN=test_c25cc3df5ddfcd6b3b2a8420700
EXPO_PUBLIC_PADDLE_ENVIRONMENT=sandbox
EXPO_PUBLIC_PADDLE_PRICE_ID=pri_01jyk3h7eec66x5m7h31p66r8w
```

## 📱 Platform-Specific Issues

### iOS Development Issues

#### Problem: Xcode build fails with signing errors
```
error: Signing for "UniPilot" requires a development team.
```

**Solution:**
```bash
# 1. Open iOS project in Xcode
open ios/UniPilot.xcworkspace

# 2. Select project in navigator
# 3. Go to Signing & Capabilities
# 4. Select your development team
# 5. Ensure bundle identifier is unique

# Alternative: Use Expo development build
npx expo run:ios
```

#### Problem: iOS Simulator not launching
```
Error: Unable to boot simulator
```

**Solution:**
```bash
# 1. Reset Xcode command line tools
sudo xcode-select --reset

# 2. List available simulators
xcrun simctl list devices

# 3. Boot specific simulator
xcrun simctl boot "iPhone 14"

# 4. If still failing, reset simulator
xcrun simctl erase all
```

#### Problem: Metro bundler connection issues on iOS
**Solution:**
```bash
# 1. Reset Metro cache
npx expo start --clear

# 2. Check network settings
# Ensure iOS simulator and development machine are on same network

# 3. Try different port
npx expo start --port 8082

# 4. Disable firewall temporarily
sudo ufw disable  # Ubuntu/Linux
# Or check macOS firewall settings
```

### Android Development Issues

#### Problem: Android SDK not found
```
Error: ANDROID_HOME is not set
```

**Solution:**
```bash
# 1. Install Android Studio
# 2. Set environment variables in ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 3. Reload shell configuration
source ~/.bashrc  # or ~/.zshrc

# 4. Verify installation
adb version
```

#### Problem: Android emulator won't start
```
Error: Emulator process for AVD was killed
```

**Solution:**
```bash
# 1. Check available AVDs
emulator -list-avds

# 2. Start emulator with more memory
emulator -avd Pixel_4_API_30 -memory 2048

# 3. Enable hardware acceleration
# On macOS: Install Intel HAXM
# On Windows: Enable Hyper-V or install Intel HAXM
# On Linux: Install KVM

# 4. Create new AVD if current one is corrupted
# Open Android Studio > AVD Manager > Create Virtual Device
```

#### Problem: Gradle build fails
```
Error: Could not resolve all files for configuration ':app:debugCompileClasspath'
```

**Solution:**
```bash
# 1. Clean Gradle cache
cd android
./gradlew clean

# 2. Clear Gradle cache globally
rm -rf ~/.gradle/caches/

# 3. Update Gradle wrapper
./gradlew wrapper --gradle-version 7.5.1

# 4. Sync project
./gradlew --refresh-dependencies
```

### Web Development Issues

#### Problem: Web build fails with module resolution errors
```
Error: Module not found: Can't resolve 'react-native-xxx'
```

**Solution:**
```bash
# 1. Check if module supports web
# Some React Native modules don't work on web

# 2. Add web-specific polyfills
npm install react-native-web

# 3. Configure webpack aliases (if using custom webpack)
# 4. Use Platform.select for conditional imports
import { Platform } from 'react-native';

const Component = Platform.select({
  web: () => require('./Component.web'),
  default: () => require('./Component.native'),
})();
```

#### Problem: Web app doesn't load or shows blank screen
**Solution:**
```bash
# 1. Check browser console for errors
# Open DevTools (F12) and check Console tab

# 2. Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# 3. Check if service worker is cached
# DevTools > Application > Storage > Clear storage

# 4. Verify build output
npx expo export:web
ls web-build/  # Should contain index.html and static assets
```

## 🔧 Build and Deployment Issues

### Expo Build Issues

#### Problem: EAS build fails with memory errors
```
Error: JavaScript heap out of memory
```

**Solution:**
```bash
# 1. Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# 2. Use larger resource class in eas.json
{
  "build": {
    "production": {
      "resourceClass": "large"
    }
  }
}

# 3. Optimize bundle size
npx expo install --fix
```

#### Problem: Build succeeds but app crashes on launch
**Solution:**
```bash
# 1. Check build logs for warnings
eas build:list

# 2. Test with development build first
eas build --profile development

# 3. Check native dependencies compatibility
# Ensure all native modules support your target SDK version

# 4. Verify app.json configuration
# Check bundle identifiers, permissions, etc.
```

### Store Submission Issues

#### Problem: iOS App Store rejection for missing privacy descriptions
**Solution:**
```json
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses camera to scan documents for your university applications",
        "NSPhotoLibraryUsageDescription": "This app accesses photo library to upload documents",
        "NSLocationWhenInUseUsageDescription": "This app uses location to find nearby educational services"
      }
    }
  }
}
```

#### Problem: Google Play rejection for target SDK version
**Solution:**
```json
// app.json
{
  "expo": {
    "android": {
      "compileSdkVersion": 34,
      "targetSdkVersion": 34
    }
  }
}
```

## 🔄 Runtime Issues

### State Management Issues

#### Problem: Zustand store not persisting data
```typescript
// Check AsyncStorage permissions and implementation
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test AsyncStorage directly
const testStorage = async () => {
  try {
    await AsyncStorage.setItem('test', 'value');
    const value = await AsyncStorage.getItem('test');
    console.log('AsyncStorage working:', value);
  } catch (error) {
    console.error('AsyncStorage error:', error);
  }
};
```

**Solution:**
```typescript
// Ensure proper Zustand persist configuration
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Add error handling
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Rehydration error:', error);
        }
      },
    }
  )
);
```

#### Problem: tRPC queries failing
```
Error: Network error: Unable to connect to server
```

**Solution:**
```typescript
// 1. Check API URL configuration
console.log('API URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);

// 2. Test API endpoint directly
curl http://localhost:3000/api/trpc/example.hi

// 3. Check CORS configuration
// backend/hono.ts
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: ['http://localhost:8081', 'https://your-domain.com'],
  credentials: true,
}));

// 4. Add error handling to tRPC client
export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      fetch: (url, options) => {
        return fetch(url, options).catch((error) => {
          console.error('TRPC fetch error:', error);
          throw new Error('Network error: Unable to connect to server');
        });
      },
    }),
  ],
});
```

### Payment Integration Issues

#### Problem: Paddle checkout not opening
**Solution:**
```typescript
// 1. Check Paddle initialization
const { paddle, isReady, isLoading } = usePaddle();
console.log('Paddle state:', { paddle, isReady, isLoading });

// 2. Verify environment variables
console.log('Paddle config:', {
  token: process.env.EXPO_PUBLIC_PADDLE_TOKEN,
  environment: process.env.EXPO_PUBLIC_PADDLE_ENVIRONMENT,
});

// 3. Check browser console for Paddle errors (web)
// 4. Test with Paddle sandbox environment first

// 5. Add error handling
const handleCheckout = async () => {
  try {
    if (!isReady) {
      throw new Error('Paddle not ready');
    }
    await openCheckout({ priceId: 'your-price-id' });
  } catch (error) {
    console.error('Checkout error:', error);
    Alert.alert('Payment Error', 'Unable to open checkout. Please try again.');
  }
};
```

## 🌐 Network and API Issues

### Connection Issues

#### Problem: API requests timing out
**Solution:**
```typescript
// Add timeout configuration to fetch
const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

// Use in tRPC client
export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      fetch: (url, options) => fetchWithTimeout(url, options, 15000),
    }),
  ],
});
```

#### Problem: CORS errors in web development
```
Access to fetch at 'http://localhost:3000/api/trpc' from origin 'http://localhost:8081' has been blocked by CORS policy
```

**Solution:**
```typescript
// backend/hono.ts
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:19006',
    'https://your-production-domain.com'
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
```

## 🔍 Debugging Tools and Techniques

### React Native Debugging

#### Enable debugging
```bash
# 1. Enable debugging in development
# Shake device or press Cmd+D (iOS) / Cmd+M (Android)
# Select "Debug with Chrome" or "Debug with Flipper"

# 2. Use React Native Debugger
npm install -g react-native-debugger
react-native-debugger

# 3. Enable network inspection
# In Chrome DevTools, go to Network tab
```

#### Flipper Integration
```bash
# 1. Install Flipper
# Download from https://fbflipper.com/

# 2. Install Flipper plugins
# React DevTools, Network, AsyncStorage

# 3. Connect device
# Ensure device and computer are on same network
```

### Performance Debugging

#### Identify performance bottlenecks
```typescript
// 1. Use React DevTools Profiler
// 2. Add performance markers
const startTime = performance.now();
// Your code here
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime} milliseconds`);

// 3. Monitor memory usage
const memoryUsage = (performance as any).memory;
console.log('Memory usage:', memoryUsage);

// 4. Use React Native Performance Monitor
import { InteractionManager } from 'react-native';

InteractionManager.runAfterInteractions(() => {
  // Heavy operations after animations complete
});
```

## 📊 Monitoring and Logging

### Error Tracking Setup

```typescript
// utils/errorTracking.ts
export const logError = (error: Error, context?: Record<string, any>) => {
  console.error('Error:', error.message, error.stack);
  
  if (__DEV__) {
    // Development logging
    console.group('Error Details');
    console.log('Context:', context);
    console.log('Stack:', error.stack);
    console.groupEnd();
  } else {
    // Production error tracking (e.g., Sentry)
    // Sentry.captureException(error, { extra: context });
  }
};

// Usage
try {
  // Risky operation
} catch (error) {
  logError(error, { userId: user?.id, action: 'payment_processing' });
}
```

### Performance Monitoring

```typescript
// utils/performanceMonitoring.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const startTime = performance.now();
  fn();
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  console.log(`${name} took ${duration.toFixed(2)}ms`);
  
  // Log slow operations
  if (duration > 100) {
    console.warn(`Slow operation detected: ${name} (${duration.toFixed(2)}ms)`);
  }
};
```

## 🆘 Getting Help

### Before Asking for Help

1. **Search existing issues**: Check GitHub issues for similar problems
2. **Check documentation**: Review relevant documentation sections
3. **Try basic troubleshooting**: Clear cache, restart development server
4. **Isolate the problem**: Create minimal reproduction case

### How to Ask for Help

#### Create a Good Issue Report

```markdown
**Environment:**
- OS: [e.g., macOS 13.0, Windows 11, Ubuntu 22.04]
- Node.js version: [e.g., 18.17.0]
- Package manager: [e.g., npm 9.6.7, yarn 1.22.19]
- Expo CLI version: [e.g., 6.3.2]
- Device/Simulator: [e.g., iPhone 14 Simulator, Pixel 5 Emulator]

**Problem Description:**
Clear description of what you're trying to do and what's happening instead.

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What you expected to happen.

**Actual Behavior:**
What actually happened.

**Error Messages:**
```
Paste full error messages here
```

**Code Sample:**
```typescript
// Minimal code that reproduces the issue
```

**Additional Context:**
Any other relevant information.
```

### Community Resources

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord** (Coming Soon): Real-time community support
- **Stack Overflow**: Tag questions with `unipilot` and `react-native`

### Professional Support

For urgent issues or consulting:
- Email: support@unipilot.com
- Priority support available for premium users

## 🔄 Regular Maintenance

### Keep Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update Expo SDK
npx expo install --fix

# Check for security vulnerabilities
npm audit
npm audit fix
```

### Clean Development Environment

```bash
# Clear all caches
npm run clean

# Or manually:
rm -rf node_modules
rm -rf .expo
rm -rf ios/build
rm -rf android/build
npm install
```

### Monitor App Health

```bash
# Check bundle size
npx expo export:web --analyze

# Run performance tests
npm run test:performance

# Check for memory leaks
# Use Chrome DevTools Memory tab
```

Remember: Most issues have been encountered by others before. Don't hesitate to search for solutions and ask for help when needed. The UniPilot community is here to support you! 🚀