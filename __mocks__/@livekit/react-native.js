console.log('[MOCK] @livekit/react-native mock loaded');

// Mock for @livekit/react-native - prevents Metro from trying to load native code in Expo Go
// This prevents RCTFatal errors when running in Expo Go
module.exports = {
  Room: class Room {
    connect() {
      console.log('[MOCK] Room.connect called');
      return Promise.resolve();
    }
  },
  RoomEvent: {},
  Track: class Track {},
  Participant: class Participant {},
  RemoteParticipant: class RemoteParticipant {},
  LocalParticipant: class LocalParticipant {},
  TrackPublication: class TrackPublication {},
  RemoteTrackPublication: class RemoteTrackPublication {},
  LocalTrackPublication: class LocalTrackPublication {},
  VideoTrack: class VideoTrack {},
  AudioTrack: class AudioTrack {},
  LocalVideoTrack: class LocalVideoTrack {},
  LocalAudioTrack: class LocalAudioTrack {},
  RemoteVideoTrack: class RemoteVideoTrack {},
  RemoteAudioTrack: class RemoteAudioTrack {},
  createLocalVideoTrack: () => {
    console.log('[MOCK] createLocalVideoTrack called');
    return Promise.resolve(null);
  },
  createLocalAudioTrack: () => {
    console.log('[MOCK] createLocalAudioTrack called');
    return Promise.resolve(null);
  },
  connect: () => {
    console.log('[MOCK] connect called');
    return Promise.resolve(null);
  },
};

