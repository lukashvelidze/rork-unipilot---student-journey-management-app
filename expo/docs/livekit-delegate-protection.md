# LiveKit Room Delegate Protection

This document describes the runtime protection for LiveKitRoom delegate methods to prevent SIGABRT crashes.

## Problem

When LiveKitRoom is being deallocated, delegate callbacks (especially `didDisconnectWithError:`, `didUpdateParticipants:`, `participantDidLeave:`, `connectionStateDidChange:`) can throw uncatchable Objective-C exceptions. These exceptions propagate through `objc_exception_rethrow` inside `ObjCTurboModule`, causing a SIGABRT crash.

## Solution

The `ios/LiveKitRoomDelegateProtector.m` file uses runtime method swizzling to wrap all LiveKitRoom delegate methods in `@try/@catch` blocks. This prevents NSExceptions from escaping and crashing the app.

## Implementation

The protection works by:

1. **Automatic Detection**: At app startup, the code scans all loaded classes to find those that implement `room:didDisconnectWithError:` (the signature method for RoomDelegate).

2. **Method Swizzling**: For each found delegate implementation, all delegate methods are swizzled to wrap the original implementation in exception handling.

3. **Exception Handling**: Each swizzled method catches NSExceptions and logs them instead of allowing them to crash the app.

## Protected Methods

The following delegate methods are protected:

### Critical Methods (most likely to crash):
- `room:didDisconnectWithError:`
- `room:participantDidLeave:`
- `room:didUpdateParticipants:`
- `room:connectionStateDidChange:`

### Optional Methods (also protected):
- `room:participantDidConnect:`
- `room:didFailToConnectWithError:`
- `room:didSubscribeToTrack:publication:participant:`
- `room:didUnsubscribeFromTrack:publication:participant:`
- `room:didPublishLocalTrack:publication:`
- `room:didUnpublishLocalTrack:publication:`
- `room:didReceiveData:from:reliable:`
- `room:localTrackDidPublish:publication:`
- `room:localTrackDidUnpublish:publication:`
- `room:trackDidSubscribe:publication:participant:`
- `room:trackDidUnsubscribe:publication:participant:`
- `room:trackSubscriptionFailed:publication:participant:error:`
- `room:trackDidMute:publication:participant:`
- `room:trackDidUnmute:publication:participant:`

## Integration

The file `ios/LiveKitRoomDelegateProtector.m` is automatically loaded when the app starts via `__attribute__((constructor))`. No additional setup is required.

### For Expo Projects

The file will be automatically included when you run `npx expo prebuild`. If it's not automatically linked, you may need to:

1. Open the Xcode project: `open ios/UniPilot.xcworkspace`
2. Right-click on your app target
3. Select "Add Files to UniPilot..."
4. Navigate to `ios/LiveKitRoomDelegateProtector.m`
5. Ensure "Copy items if needed" is checked
6. Ensure your app target is selected

### For Bare React Native Projects

The file should be automatically linked if it's in the `ios` directory. If not, add it manually to your Xcode project.

## Verification

After integrating, you should see log messages like:

```
[LiveKit] LiveKitRoomDelegateProtector initializing...
[LiveKit] Found RoomDelegate implementation: YourDelegateClassName
[LiveKit] Swizzled delegate methods for YourDelegateClassName
[LiveKit] LiveKitRoomDelegateProtector successfully initialized
```

If exceptions are caught, you'll see:

```
[LiveKit] Prevented crash in didDisconnectWithError: NSExceptionName - Exception reason
```

## Notes

- This is a **defensive** solution that catches exceptions rather than fixing the root cause
- Exceptions are logged but don't crash the app
- The protection is transparent - delegate methods still work normally, just with exception handling
- This complements the other LiveKit crash fixes (NSException handler, JSI protection)

## Related Fixes

This protection works alongside:
1. `LKExceptionHandler` - Prevents NSExceptions in native module methods
2. `WebRTCModule+JSIProtection` - Prevents JSI use-after-free crashes
3. This delegate protection - Prevents SIGABRT from delegate exceptions

Together, these three fixes eliminate all known LiveKit New Architecture crashes.

