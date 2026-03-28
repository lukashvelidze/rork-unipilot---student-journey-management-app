# iOS Crash Fix: NSException Prevention in TurboModules

## Problem

The app was crashing on iOS with the error:
```
EXC_BAD_ACCESS in hermes → JSObject::addOwnPropertyImpl → TurboModuleConvertUtils::convertNSExceptionToJSError
```

This is a known React Native New Architecture bug that occurs when an Objective-C `NSException` escapes from a TurboModule/native module while the JS runtime is shutting down or already partially destroyed.

## Solution

We've implemented comprehensive NSException handling for all native module methods in the `@livekit/react-native` package.

### Changes Made

1. **Created Exception Handler Helper** (`LKExceptionHandler.h/m`)
   - Objective-C utility class that safely wraps code blocks with `@try/@catch`
   - Prevents NSExceptions from escaping to the JavaScript runtime
   - Logs exceptions for debugging

2. **Added Method Swizzling Wrapper** (`LivekitReactNativeModule+ExceptionHandling.m`)
   - Automatically wraps all exported native module methods
   - Uses Objective-C runtime method swizzling to intercept method calls
   - Wraps each method in `@try/@catch` blocks

3. **Fixed Force Unwrapping Issues**
   - Replaced force unwrapping (`as!`) with safe optional binding (`as?`) in:
     - `LiveKitReactNativeModule.swift` - `showAudioRoutePicker` method
     - `AudioRendererManager.swift` - `attach` and `detach` methods

4. **Created Patch File**
   - Used `patch-package` to create a patch that will be automatically applied after `npm install`
   - Patch file: `patches/@livekit+react-native+2.9.5.patch`

### Protected Methods

All the following native module methods are now protected with exception handling:

- `configureAudio:`
- `startAudioSession:withRejecter:`
- `stopAudioSession:withRejecter:`
- `showAudioRoutePicker`
- `getAudioOutputsWithResolver:withRejecter:`
- `selectAudioOutput:withResolver:withRejecter:`
- `setAppleAudioConfiguration:withResolver:withRejecter:`
- `createAudioSinkListener:trackId:`
- `deleteAudioSinkListener:pcId:trackId:`
- `createVolumeProcessor:trackId:`
- `deleteVolumeProcessor:pcId:trackId:`
- `createMultibandVolumeProcessor:pcId:trackId:`
- `deleteMultibandVolumeProcessor:pcId:trackId:`
- `setDefaultAudioTrackVolume:`

## Installation

The patch is automatically applied after running `npm install` thanks to the `postinstall` script in `package.json`.

If you need to manually apply the patch:
```bash
npx patch-package @livekit/react-native
```

## How It Works

1. **Method Swizzling**: When the module loads, the `__attribute__((constructor))` function runs and replaces the original method implementations with wrapped versions.

2. **Exception Catching**: Each wrapped method uses `@try/@catch` to catch any `NSException` that might be thrown.

3. **Error Handling**: 
   - For promise-based methods: Exceptions are converted to promise rejections
   - For synchronous methods: Exceptions are logged and safe fallback values are returned
   - All exceptions are logged to the console for debugging

## Testing

After applying the patch, test the following scenarios:
1. Audio session management (start/stop)
2. Audio route selection
3. Audio sink/listener creation and deletion
4. Volume processor operations
5. App backgrounding/foregrounding (common trigger for this crash)

## Monitoring

Check the iOS console logs for messages like:
```
Native module exception prevented: [ExceptionName] - [ExceptionReason]
```

These logs indicate that exceptions were caught and prevented from crashing the app.

## Future Updates

⚠️ **Important**: If you update `@livekit/react-native` to a new version, you'll need to:
1. Check if the patch still applies
2. Recreate the patch if the module structure changed
3. Run `npx patch-package @livekit/react-native` to update the patch

## Additional Notes

- The patch only affects the `@livekit/react-native` package
- If crashes persist, consider patching `@livekit/react-native-webrtc` as well
- The exception handler is lightweight and has minimal performance impact
- All original functionality is preserved - we're just adding safety wrappers

## Related Files

- `patches/@livekit+react-native+2.9.5.patch` - The patch file
- `node_modules/@livekit/react-native/ios/LKExceptionHandler.h/m` - Exception handler
- `node_modules/@livekit/react-native/ios/LivekitReactNativeModule+ExceptionHandling.m` - Method swizzling wrapper
- `package.json` - Contains postinstall script

