console.log('[MOCK] @livekit/react-native-webrtc mock loaded');

// Mock for @livekit/react-native-webrtc - prevents Metro from trying to load native code in Expo Go
// This prevents RCTFatal errors when running in Expo Go
module.exports = {
  RTCPeerConnection: class RTCPeerConnection {
    constructor() {
      console.log('[MOCK] RTCPeerConnection created');
    }
  },
  RTCSessionDescription: class RTCSessionDescription {},
  RTCIceCandidate: class RTCIceCandidate {},
  MediaStream: class MediaStream {},
  MediaStreamTrack: class MediaStreamTrack {},
  getUserMedia: () => {
    console.log('[MOCK] getUserMedia called');
    return Promise.resolve(null);
  },
  getDisplayMedia: () => {
    console.log('[MOCK] getDisplayMedia called');
    return Promise.resolve(null);
  },
};

