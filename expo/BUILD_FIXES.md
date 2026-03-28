# iOS Build & Crash Fixes - UniPilot

This document outlines all the fixes applied to resolve iOS build issues and crashes reported in the crash log.

## Critical Fixes Applied

### 1. **Regex Operations Causing Hermes Crashes** ✅

**Problem**: The crash log showed crashes in `hermes::vm::regExpPrototypeExec` and `hermes::vm::stringPrototypeReplace`, indicating regex operations were crashing the Hermes JavaScript engine on iOS.

**Root Cause**:
- UUID generation using `.replace(/[xy]/g, ...)` in `lib/supabase.ts:153`
- Text capitalization using `.replace(/\b\w/g, ...)` in `app/onboarding/step6-finish.tsx:174`
- Stage name formatting using `.replace('_', ' ')` with regex patterns

**Solution**:
- Created `utils/safeStringOps.ts` with regex-free string utilities
- Replaced UUID generation with character-by-character iteration
- Replaced regex-based text operations with safe string manipulation
- Added `formatEnumValue()` helper for safe enum formatting

**Files Modified**:
- `lib/supabase.ts` - Fixed `generateUUID()` function
- `app/onboarding/step6-finish.tsx` - Used `formatEnumValue()` instead of regex
- `app/(tabs)/index.tsx` - Used `formatEnumValue()` for stage names
- `utils/safeStringOps.ts` - Created new utility file

### 2. **New Architecture Enabled** ✅

**Problem**: New Architecture was disabled via plugin and configuration, causing potential compatibility issues with newer React Native modules.

**Solution**:
- Enabled New Architecture in `app.json`:
  - Set `newArchEnabled: true` globally
  - Set `newArchEnabled: true` for iOS
  - Set `newArchEnabled: true` for Android
  - Removed `./plugins/withDisableNewArch.js` plugin
  - Changed JS engine from `jsc` to `hermes` for better performance

**Files Modified**:
- `app.json` - Enabled New Architecture across all platforms

### 3. **Comprehensive Error Boundaries** ✅

**Problem**: App lacked global error handling to catch and recover from crashes gracefully.

**Solution**:
- Added `ErrorBoundary` wrapper to root layout
- Integrated iOS crash prevention utilities
- Added error handling to QueryClient for API failures
- Enhanced WebView error handling with retry functionality

**Files Modified**:
- `app/_layout.tsx` - Added root ErrorBoundary and iOS crash prevention
- `app/webview.tsx` - Added WebViewErrorBoundary and comprehensive error handling
- `components/ErrorBoundary.tsx` - Already existed, now properly integrated

### 4. **iOS Crash Prevention System** ✅

**Problem**: iOS-specific crashes needed special handling.

**Solution**:
- Initialized `IOSCrashPrevention` at app startup
- Wrapped query operations with error handlers
- Added retry logic with exponential backoff
- Integrated memory protection checks

**Files Modified**:
- `app/_layout.tsx` - Initialized IOSCrashPrevention
- Leveraged existing `utils/iosCrashPrevention.ts`

### 5. **WebView Safety Enhancements** ✅

**Problem**: WebView errors could crash the app, especially during Paddle checkout.

**Solution**:
- Added `WebViewErrorBoundary` wrapper
- Implemented `onError` and `onHttpError` handlers
- Added loading states and retry functionality
- Proper error display with user-friendly messages

**Files Modified**:
- `app/webview.tsx` - Complete error handling overhaul

### 6. **Safe String Operations Utility** ✅

**Problem**: Need regex-free alternatives for common string operations to prevent future crashes.

**Solution**: Created comprehensive utility library with:
- `capitalizeWords()` - Safe word capitalization
- `formatEnumValue()` - Format enum values (underscore_case → Title Case)
- `generateUUID()` - Safe UUID generation without regex
- `removeNonAlphanumeric()` - Character filtering without regex
- `safeTrim()` - Whitespace trimming without regex
- `isValidEmail()` - Email validation without regex
- `createSlug()` - URL slug creation without regex
- `truncate()` - String truncation
- `containsIgnoreCase()` - Safe case-insensitive search

**Files Created**:
- `utils/safeStringOps.ts` - New utility library

## Additional Improvements

### Error Handling
- QueryClient now has built-in retry logic (2 attempts for queries, 1 for mutations)
- Exponential backoff for retries
- 5-minute stale time for cached queries
- Comprehensive error logging

### Code Quality
- Removed all problematic regex operations
- Added TypeScript safety throughout
- Improved error messages for better debugging
- Added proper loading states

## Testing Checklist

Before deploying, verify:

- [ ] App starts without crashes
- [ ] Onboarding flow completes successfully
- [ ] UUID generation works (check document uploads)
- [ ] Text formatting displays correctly (education level, stage names)
- [ ] WebView loads Paddle checkout without errors
- [ ] Error boundaries catch and display errors gracefully
- [ ] App recovers from errors without requiring restart
- [ ] New Architecture builds successfully on iOS
- [ ] ElevenLabs integration works (in development build)
- [ ] Paddle payment flow completes

## Build Instructions

### Clean Build (Recommended)

```bash
# Clean all build artifacts
rm -rf ios android .expo node_modules

# Reinstall dependencies
npm install

# Run iOS development build
npx expo run:ios

# Or Android
npx expo run:android
```

### Quick Build

```bash
# Install dependencies
npm install

# Run iOS
npx expo run:ios
```

## Environment Variables Required

Ensure these are set in your environment:

```bash
EXPO_PUBLIC_PADDLE_CHECKOUT_URL=<your_paddle_checkout_url>
EXPO_PUBLIC_PADDLE_PRICE_ID_BASIC=<basic_price_id>
EXPO_PUBLIC_PADDLE_PRICE_ID_STANDARD=<standard_price_id>
EXPO_PUBLIC_PADDLE_PRICE_ID_PRO=<pro_price_id>
EXPO_PUBLIC_ELEVENLABS_AGENT_ID=<elevenlabs_agent_id>
```

## Known Limitations

1. **Expo Go**: ElevenLabs interview simulator requires native modules and will not work in Expo Go. Users will see a helpful error message directing them to build a development build.

2. **New Architecture**: This is the first build with New Architecture enabled. Monitor for any compatibility issues with third-party libraries.

3. **Hermes Engine**: Changed from JavaScriptCore to Hermes. Performance should improve, but monitor for any engine-specific issues.

## Monitoring & Debugging

### iOS Crash Logs

If crashes occur, check:
1. Xcode console for detailed crash logs
2. Console logs for error messages from ErrorBoundary
3. `IOSCrashPrevention` logs (prefixed with 🍎 or 🚨)

### Common Issues

**"Module not found" errors**:
```bash
rm -rf node_modules
npm install
npx expo prebuild --clean
```

**Pod installation fails**:
```bash
cd ios
pod install --repo-update
cd ..
```

**Build fails with New Architecture**:
- Ensure all dependencies support New Architecture
- Check for compatibility with React Native 0.81.5
- Review build logs for specific module issues

## Files Changed Summary

### Modified Files
- `app.json` - Enabled New Architecture, changed to Hermes
- `app/_layout.tsx` - Added error boundaries and crash prevention
- `app/webview.tsx` - Enhanced error handling
- `app/onboarding/step6-finish.tsx` - Safe string operations
- `app/(tabs)/index.tsx` - Safe string operations
- `lib/supabase.ts` - Safe UUID generation

### New Files
- `utils/safeStringOps.ts` - Regex-free string utilities
- `BUILD_FIXES.md` - This file

### Removed Plugins
- `plugins/withDisableNewArch.js` - Removed from app.json plugins array

## Next Steps

1. **Test thoroughly** on physical iOS devices
2. **Monitor** crash reports in production
3. **Update** any remaining string operations to use safe utilities
4. **Document** any new issues discovered
5. **Submit** to TestFlight for beta testing

## Support

If issues persist:
1. Check console logs for specific error messages
2. Review crash logs in Xcode
3. Verify all environment variables are set correctly
4. Ensure all dependencies are up to date
5. Try a clean build (remove ios/android directories)

---

**Last Updated**: 2025-12-04
**React Native Version**: 0.81.5
**Expo SDK**: ~54.0.25
**Architecture**: New Architecture (Fabric + TurboModules)
**JS Engine**: Hermes
