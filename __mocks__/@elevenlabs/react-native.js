console.log('[MOCK] @elevenlabs/react-native mock loaded');

// Mock for @elevenlabs/react-native - prevents Metro from trying to load native code in Expo Go
// This file is used when the module is required but native code isn't available

module.exports = {
  ElevenLabsProvider: ({ children }) => {
    console.log('[MOCK] ElevenLabsProvider used');
    return children;
  },
  useConversation: () => {
    console.log('[MOCK] useConversation hook called');
    return {
      startSession: async () => {
        console.log('[MOCK] startSession called');
      },
      endSession: async () => {
        console.log('[MOCK] endSession called');
      },
      setMicMuted: () => {
        console.log('[MOCK] setMicMuted called');
      },
      sendFeedback: async () => {
        console.log('[MOCK] sendFeedback called');
      },
      isSpeaking: false,
      canSendFeedback: false,
    };
  },
};

