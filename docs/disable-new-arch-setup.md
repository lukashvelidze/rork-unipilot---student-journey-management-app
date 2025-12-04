# Disable New Architecture - Complete Setup

This document describes the complete setup to disable React Native New Architecture at all levels to ensure 100% compatibility with LiveKit and Reanimated 3.15.x.

## Problem

Even with `newArchEnabled: false` in `app.json`, Expo may still generate some New Architecture code (Fabric/folly/coro) at the native level, causing build errors like:

```
'folly/coro/Coroutine.h' file not found
```

This happens in ReanimatedRuntime.cpp when the build system tries to compile New Architecture code even though it's disabled.

## Solution

We disable New Architecture at **every possible level** and use a config plugin to force `RCT_NEW_ARCH_ENABLED=0` in Xcode build settings.

## Configuration

### 1. app.json Settings

The following settings ensure New Architecture is disabled at all levels:

```json
{
  "expo": {
    "newArchEnabled": false,
    "ios": {
      "newArchEnabled": false
    },
    "android": {
      "newArchEnabled": false
    },
    "experiments": {
      "newArchEnabled": false
    },
    "plugins": [
      "./plugins/withDisableNewArch.js"
    ]
  }
}
```

### 2. Config Plugin

The `plugins/withDisableNewArch.js` plugin:
- Forces `RCT_NEW_ARCH_ENABLED=0` in Xcode build settings
- Applies to both Debug and Release configurations
- Properly handles existing `GCC_PREPROCESSOR_DEFINITIONS` by:
  - Reading existing definitions (handles both string and array formats)
  - Appending `RCT_NEW_ARCH_ENABLED=0` if not present
  - Replacing existing `RCT_NEW_ARCH_ENABLED` flags with `=0`
  - Formatting as space-separated string for Xcode project file compatibility

This ensures that even if Expo generates New Architecture code, it will be disabled at compile time, and the Xcode project file format is correct (no CocoaPods parsing errors).

## Setup Steps

After making these changes, perform a **nuclear clean** to regenerate the Xcode project from scratch:

```bash
# 1. Remove the entire ios folder (or just the .xcodeproj)
rm -rf ios/

# 2. Remove all build artifacts and dependencies
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -rf ios/Podfile.lock

# 3. Reinstall dependencies
npm install

# 4. Clean and regenerate native projects from scratch
npx expo prebuild --clean

# 5. For EAS builds
eas build --platform ios --profile production
```

**Important**: The nuclear clean (removing the entire `ios/` folder) is necessary to regenerate the Xcode project file without the malformed semicolon parsing error.

## Verification

After running `npx expo prebuild --clean`, you can verify the settings:

1. Open `ios/UniPilot.xcworkspace` in Xcode
2. Select your target
3. Go to Build Settings
4. Search for "RCT_NEW_ARCH_ENABLED"
5. Verify it's set to `0` for both Debug and Release

## Expected Results

✅ **Build succeeds** - No more `folly/coro/Coroutine.h` errors  
✅ **LiveKit stable** - 100% compatibility with old architecture  
✅ **Reanimated 3.15.x works** - All animations function correctly  
✅ **No New Architecture code** - Everything uses the stable bridge  

## Related Configuration

This setup works with:
- Expo SDK 54
- `react-native-reanimated@~3.15.1`
- `newArchEnabled: false` at all levels
- LiveKit packages (no crashes)

## Troubleshooting

### CocoaPods Parsing Error

If you see this error:
```
Dictionary missing ';' after key-value pair for "GCC_PREPROCESSOR_DEFINITIONS"
```

**Solution**: Perform a nuclear clean:
```bash
rm -rf ios/
rm -rf node_modules ios/Pods ios/build ios/Podfile.lock
npm install
npx expo prebuild --clean
```

This regenerates the Xcode project file with properly formatted definitions.

### Other Issues

If you still see New Architecture errors:

1. **Double-check app.json** - Ensure `newArchEnabled: false` is set at all levels
2. **Verify plugin is loaded** - Check that `./plugins/withDisableNewArch.js` is in the plugins array
3. **Clean everything** - Remove `ios/` and `android/` folders, then run `npx expo prebuild --clean`
4. **Check Xcode settings** - Manually verify `RCT_NEW_ARCH_ENABLED=0` in Build Settings
5. **Check Podfile** - Ensure no New Architecture pods are being installed

## Notes

- This is a **defensive** approach that disables New Architecture at multiple levels
- The config plugin ensures compile-time disabling even if Expo generates some New Architecture code
- This setup is specifically optimized for LiveKit + Reanimated 3.15.x stability

