//
// LiveKitRoomDelegateProtector.m
// Runtime protection for LiveKitRoom delegate methods
// Prevents SIGABRT crashes from NSException in delegate callbacks during room deallocation
//

#import <Foundation/Foundation.h>
#import <objc/runtime.h>

// Forward declarations for LiveKit types
@class LiveKitRoom;
@class RemoteParticipant;
@class Participant;
typedef NSInteger ConnectionState;

// Store original implementations
static IMP original_didDisconnectWithError = NULL;
static IMP original_participantDidLeave = NULL;
static IMP original_didUpdateParticipants = NULL;
static IMP original_connectionStateDidChange = NULL;
static IMP original_participantDidConnect = NULL;
static IMP original_didFailToConnect = NULL;
static IMP original_didSubscribeToTrack = NULL;
static IMP original_didUnsubscribeFromTrack = NULL;
static IMP original_didPublishLocalTrack = NULL;
static IMP original_didUnpublishLocalTrack = NULL;
static IMP original_didReceiveData = NULL;
static IMP original_localTrackDidPublish = NULL;
static IMP original_localTrackDidUnpublish = NULL;
static IMP original_trackDidSubscribe = NULL;
static IMP original_trackDidUnsubscribe = NULL;
static IMP original_trackSubscriptionFailed = NULL;
static IMP original_trackDidMute = NULL;
static IMP original_trackDidUnmute = NULL;

// Wrapper implementations with exception handling
static void wrapped_didDisconnectWithError(id self, SEL _cmd, LiveKitRoom *room, NSError *error) {
    @try {
        if (original_didDisconnectWithError) {
            ((void (*)(id, SEL, LiveKitRoom *, NSError *))original_didDisconnectWithError)(self, _cmd, room, error);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in didDisconnectWithError: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_participantDidLeave(id self, SEL _cmd, LiveKitRoom *room, RemoteParticipant *participant) {
    @try {
        if (original_participantDidLeave) {
            ((void (*)(id, SEL, LiveKitRoom *, RemoteParticipant *))original_participantDidLeave)(self, _cmd, room, participant);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in participantDidLeave: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_didUpdateParticipants(id self, SEL _cmd, LiveKitRoom *room, NSArray<Participant *> *participants) {
    @try {
        if (original_didUpdateParticipants) {
            ((void (*)(id, SEL, LiveKitRoom *, NSArray<Participant *> *))original_didUpdateParticipants)(self, _cmd, room, participants);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in didUpdateParticipants: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_connectionStateDidChange(id self, SEL _cmd, LiveKitRoom *room, ConnectionState state) {
    @try {
        if (original_connectionStateDidChange) {
            ((void (*)(id, SEL, LiveKitRoom *, ConnectionState))original_connectionStateDidChange)(self, _cmd, room, state);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in connectionStateDidChange: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_participantDidConnect(id self, SEL _cmd, LiveKitRoom *room, RemoteParticipant *participant) {
    @try {
        if (original_participantDidConnect) {
            ((void (*)(id, SEL, LiveKitRoom *, RemoteParticipant *))original_participantDidConnect)(self, _cmd, room, participant);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in participantDidConnect: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_didFailToConnect(id self, SEL _cmd, LiveKitRoom *room, NSError *error) {
    @try {
        if (original_didFailToConnect) {
            ((void (*)(id, SEL, LiveKitRoom *, NSError *))original_didFailToConnect)(self, _cmd, room, error);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in didFailToConnect: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_didSubscribeToTrack(id self, SEL _cmd, LiveKitRoom *room, id track, id publication, id participant) {
    @try {
        if (original_didSubscribeToTrack) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id, id))original_didSubscribeToTrack)(self, _cmd, room, track, publication, participant);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in didSubscribeToTrack: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_didUnsubscribeFromTrack(id self, SEL _cmd, LiveKitRoom *room, id track, id publication, id participant) {
    @try {
        if (original_didUnsubscribeFromTrack) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id, id))original_didUnsubscribeFromTrack)(self, _cmd, room, track, publication, participant);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in didUnsubscribeFromTrack: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_didPublishLocalTrack(id self, SEL _cmd, LiveKitRoom *room, id track, id publication) {
    @try {
        if (original_didPublishLocalTrack) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id))original_didPublishLocalTrack)(self, _cmd, room, track, publication);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in didPublishLocalTrack: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_didUnpublishLocalTrack(id self, SEL _cmd, LiveKitRoom *room, id track, id publication) {
    @try {
        if (original_didUnpublishLocalTrack) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id))original_didUnpublishLocalTrack)(self, _cmd, room, track, publication);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in didUnpublishLocalTrack: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_didReceiveData(id self, SEL _cmd, LiveKitRoom *room, NSData *data, id participant, BOOL reliable) {
    @try {
        if (original_didReceiveData) {
            ((void (*)(id, SEL, LiveKitRoom *, NSData *, id, BOOL))original_didReceiveData)(self, _cmd, room, data, participant, reliable);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in didReceiveData: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_localTrackDidPublish(id self, SEL _cmd, LiveKitRoom *room, id track, id publication) {
    @try {
        if (original_localTrackDidPublish) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id))original_localTrackDidPublish)(self, _cmd, room, track, publication);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in localTrackDidPublish: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_localTrackDidUnpublish(id self, SEL _cmd, LiveKitRoom *room, id track, id publication) {
    @try {
        if (original_localTrackDidUnpublish) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id))original_localTrackDidUnpublish)(self, _cmd, room, track, publication);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in localTrackDidUnpublish: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_trackDidSubscribe(id self, SEL _cmd, LiveKitRoom *room, id track, id publication, id participant) {
    @try {
        if (original_trackDidSubscribe) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id, id))original_trackDidSubscribe)(self, _cmd, room, track, publication, participant);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in trackDidSubscribe: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_trackDidUnsubscribe(id self, SEL _cmd, LiveKitRoom *room, id track, id publication, id participant) {
    @try {
        if (original_trackDidUnsubscribe) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id, id))original_trackDidUnsubscribe)(self, _cmd, room, track, publication, participant);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in trackDidUnsubscribe: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_trackSubscriptionFailed(id self, SEL _cmd, LiveKitRoom *room, id track, id publication, id participant, NSError *error) {
    @try {
        if (original_trackSubscriptionFailed) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id, id, NSError *))original_trackSubscriptionFailed)(self, _cmd, room, track, publication, participant, error);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in trackSubscriptionFailed: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_trackDidMute(id self, SEL _cmd, LiveKitRoom *room, id track, id publication, id participant) {
    @try {
        if (original_trackDidMute) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id, id))original_trackDidMute)(self, _cmd, room, track, publication, participant);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in trackDidMute: %@ - %@", exception.name, exception.reason);
    }
}

static void wrapped_trackDidUnmute(id self, SEL _cmd, LiveKitRoom *room, id track, id publication, id participant) {
    @try {
        if (original_trackDidUnmute) {
            ((void (*)(id, SEL, LiveKitRoom *, id, id, id))original_trackDidUnmute)(self, _cmd, room, track, publication, participant);
        }
    }
    @catch (NSException *exception) {
        NSLog(@"[LiveKit] Prevented crash in trackDidUnmute: %@ - %@", exception.name, exception.reason);
    }
}

// Helper function to swizzle a method
static void swizzleMethod(Class cls, SEL originalSelector, IMP newImplementation, IMP *originalImplementation) {
    Method method = class_getInstanceMethod(cls, originalSelector);
    if (method) {
        IMP currentImplementation = method_getImplementation(method);
        if (currentImplementation != newImplementation) {
            *originalImplementation = currentImplementation;
            method_setImplementation(method, newImplementation);
        }
    }
}

// Perform swizzling at load time using constructor attribute
__attribute__((constructor))
static void setupLiveKitRoomDelegateProtection() {
    NSLog(@"[LiveKit] LiveKitRoomDelegateProtector initializing...");
    
    // Wait a bit for LiveKit classes to be loaded, then try again
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        // Find classes that implement RoomDelegate methods
        int numClasses = objc_getClassList(NULL, 0);
        BOOL foundDelegate = NO;
        
        if (numClasses > 0) {
            Class *classes = (Class *)malloc(sizeof(Class) * numClasses);
            numClasses = objc_getClassList(classes, numClasses);
            
            for (int i = 0; i < numClasses; i++) {
                Class cls = classes[i];
                const char *className = class_getName(cls);
                
                // Skip system classes and our own class
                if (strncmp(className, "NS", 2) == 0 || 
                    strncmp(className, "_", 1) == 0 ||
                    strstr(className, "LiveKitRoomDelegateProtector") != NULL) {
                    continue;
                }
                
                // Check if class implements RoomDelegate methods
                // We'll swizzle on any class that implements didDisconnectWithError
                if (class_getInstanceMethod(cls, @selector(room:didDisconnectWithError:))) {
                    NSLog(@"[LiveKit] Found RoomDelegate implementation: %s", className);
                    foundDelegate = YES;
                    
                    // Swizzle critical delegate methods (the ones most likely to crash)
                    swizzleMethod(cls, @selector(room:didDisconnectWithError:), (IMP)wrapped_didDisconnectWithError, &original_didDisconnectWithError);
                    swizzleMethod(cls, @selector(room:participantDidLeave:), (IMP)wrapped_participantDidLeave, &original_participantDidLeave);
                    swizzleMethod(cls, @selector(room:didUpdateParticipants:), (IMP)wrapped_didUpdateParticipants, &original_didUpdateParticipants);
                    swizzleMethod(cls, @selector(room:connectionStateDidChange:), (IMP)wrapped_connectionStateDidChange, &original_connectionStateDidChange);
                    
                    // Swizzle optional methods if they exist
                    swizzleMethod(cls, @selector(room:participantDidConnect:), (IMP)wrapped_participantDidConnect, &original_participantDidConnect);
                    swizzleMethod(cls, @selector(room:didFailToConnectWithError:), (IMP)wrapped_didFailToConnect, &original_didFailToConnect);
                    swizzleMethod(cls, @selector(room:didSubscribeToTrack:publication:participant:), (IMP)wrapped_didSubscribeToTrack, &original_didSubscribeToTrack);
                    swizzleMethod(cls, @selector(room:didUnsubscribeFromTrack:publication:participant:), (IMP)wrapped_didUnsubscribeFromTrack, &original_didUnsubscribeFromTrack);
                    swizzleMethod(cls, @selector(room:didPublishLocalTrack:publication:), (IMP)wrapped_didPublishLocalTrack, &original_didPublishLocalTrack);
                    swizzleMethod(cls, @selector(room:didUnpublishLocalTrack:publication:), (IMP)wrapped_didUnpublishLocalTrack, &original_didUnpublishLocalTrack);
                    swizzleMethod(cls, @selector(room:didReceiveData:from:reliable:), (IMP)wrapped_didReceiveData, &original_didReceiveData);
                    swizzleMethod(cls, @selector(room:localTrackDidPublish:publication:), (IMP)wrapped_localTrackDidPublish, &original_localTrackDidPublish);
                    swizzleMethod(cls, @selector(room:localTrackDidUnpublish:publication:), (IMP)wrapped_localTrackDidUnpublish, &original_localTrackDidUnpublish);
                    swizzleMethod(cls, @selector(room:trackDidSubscribe:publication:participant:), (IMP)wrapped_trackDidSubscribe, &original_trackDidSubscribe);
                    swizzleMethod(cls, @selector(room:trackDidUnsubscribe:publication:participant:), (IMP)wrapped_trackDidUnsubscribe, &original_trackDidUnsubscribe);
                    swizzleMethod(cls, @selector(room:trackSubscriptionFailed:publication:participant:error:), (IMP)wrapped_trackSubscriptionFailed, &original_trackSubscriptionFailed);
                    swizzleMethod(cls, @selector(room:trackDidMute:publication:participant:), (IMP)wrapped_trackDidMute, &original_trackDidMute);
                    swizzleMethod(cls, @selector(room:trackDidUnmute:publication:participant:), (IMP)wrapped_trackDidUnmute, &original_trackDidUnmute);
                    
                    NSLog(@"[LiveKit] Swizzled delegate methods for %s", className);
                }
            }
            
            free(classes);
        }
        
        if (foundDelegate) {
            NSLog(@"[LiveKit] LiveKitRoomDelegateProtector successfully initialized");
        } else {
            NSLog(@"[LiveKit] LiveKitRoomDelegateProtector: No RoomDelegate implementations found yet (will retry on next app launch)");
        }
    });
}

