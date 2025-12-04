//
// LiveKitRoomDelegateProtector.h
// Runtime protection for LiveKitRoom delegate methods
// Prevents SIGABRT crashes from NSException in delegate callbacks during room deallocation
//

#import <Foundation/Foundation.h>

// This file provides runtime protection for LiveKitRoom delegate methods.
// The implementation in LiveKitRoomDelegateProtector.m uses method swizzling
// to wrap all delegate callbacks in @try/@catch blocks to prevent crashes
// from NSExceptions that occur during room deallocation.
//
// The protection is automatically enabled when the module is loaded via
// __attribute__((constructor)).

