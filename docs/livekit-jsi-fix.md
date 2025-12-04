# LiveKit New Architecture JSI Use-After-Free Fix

This document describes the fix for the known LiveKit + React Native New Architecture use-after-free crash in `@livekit/react-native-webrtc`.

## Problem

When using React Native's New Architecture with LiveKit, the app crashes with:
```
hermes::vm::GCScope::_newChunkAndPHV → newPinnedHermesValue → HiddenClass::addToPropertyMap
```

This occurs while executing `Array.prototype.slice` on the JS thread during a TurboModule call return. The root cause is storing `jsi::Object`, `jsi::Function`, or `jsi::Value` directly as member variables without wrapping in `std::shared_ptr` or `jsi::WeakObject`.

## Solution

### 1. Patch Applied

A patch has been created at `patches/@livekit+react-native-webrtc+137.0.2.patch` that:
- Adds JSI protection wrapper methods
- Swizzles `sendEventWithName:body:` to catch exceptions
- Replaces all `sendEventWithName` calls with `safeSendEventWithName` in:
  - `WebRTCModule+RTCPeerConnection.m`
  - `WebRTCModule+RTCDataChannel.m`
  - `WebRTCModule+RTCFrameCryptor.m`
  - `WebRTCModule+VideoTrackAdapter.m`
  - `TrackCapturerEventsEmitter.m`

The patch is automatically applied via `patch-package` during `npm install` or `npm postinstall`.

### 2. Podfile Configuration

The Expo config plugin (`plugins/withLiveKitJSIFix.js`) automatically adds the following to `ios/Podfile` in the `:post_install` block:

```ruby
config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', 'HERMES_ENABLE_DEBUG=1']
```

**Manual Setup (if plugin doesn't work):**

1. Open `ios/Podfile`
2. Find the `post_install do |installer|` block
3. Inside the `installer.pods_project.targets.each do |target|` loop, add:
   ```ruby
   config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', 'HERMES_ENABLE_DEBUG=1']
   ```

### 3. AppDelegate Configuration

The Expo config plugin automatically adds the following to `AppDelegate.swift` or `AppDelegate.m`:

**For Swift (`AppDelegate.swift`):**
```swift
import LiveKit

// In didFinishLaunchingWithOptions or init():
LiveKitClient.setOptions(.init(hermesDebug: true))
```

**For Objective-C (`AppDelegate.m`):**
```objc
#import <LiveKit/LiveKit-Swift.h>

// In didFinishLaunchingWithOptions:
[LiveKitClient setOptionsWithOptions:[[LKClientOptions alloc] initWithHermesDebug:YES]];
```

**Manual Setup (if plugin doesn't work):**

1. Open `ios/UniPilot/AppDelegate.swift` (or `AppDelegate.m`)
2. Add the import statement at the top
3. Add the `setOptions` call in `didFinishLaunchingWithOptions` or `init()`

### 4. Rebuild

After applying these changes:

1. **If using Expo:**
   ```bash
   npx expo prebuild --clean
   cd ios && pod install && cd ..
   ```

2. **If using bare React Native:**
   ```bash
   cd ios && pod install && cd ..
   ```

3. Rebuild the app:
   ```bash
   npx expo run:ios
   # or
   npm run ios
   ```

## How It Works

1. **JSI Protection**: The patch wraps all event emission calls with exception handling to prevent crashes from use-after-free errors.

2. **Method Swizzling**: The `sendEventWithName:body:` method is swizzled at runtime to catch any exceptions that occur during event emission.

3. **Hermes Debug**: Enabling `HERMES_ENABLE_DEBUG=1` helps surface bad references earlier during development.

4. **LiveKit Options**: Setting `hermesDebug: true` in LiveKitClient options helps identify and address issues related to Hermes garbage collection.

## Verification

After applying the fix, you should:
- No longer see crashes related to `GCScope::_newChunkAndPHV`
- See debug logs from WebRTCModule if exceptions are caught (they will be handled gracefully)
- Have stable WebRTC peer connections without crashes

## Notes

- The patch uses defensive programming to catch and log exceptions rather than crashing
- Events that fail to send will be logged but won't crash the app
- This is a workaround until the upstream packages fix the JSI reference handling

