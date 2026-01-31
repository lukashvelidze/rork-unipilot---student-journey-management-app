import { ElevenLabsProvider, useConversation } from '@elevenlabs/react-native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useColors } from '@/hooks/useColors';
function ConversationScreen() {
  const Colors = useColors();
  const [isConnected, setIsConnected] = useState(false);
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to conversation');
      setIsConnected(true);
    },
    onDisconnect: () => {
      console.log('Disconnected from conversation');
      setIsConnected(false);
    },
    onMessage: (message) => {
      console.log('Message received:', message);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
    },
  });
  const startConversation = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Microphone permission not granted');
        return;
      }

      await conversation.startSession({
        agentId: 'agent_7401k7a0wx3mfy2tmm361gsbh61a',
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };
  const endConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: Colors.primary + '20' }]}>
          <Text style={styles.headerIconText}>🎙️</Text>
        </View>
        <Text style={[styles.title, { color: Colors.text }]}>Interview Simulator</Text>
        <Text style={[styles.subtitle, { color: Colors.lightText }]}>
          Practice visa and university interviews with AI
        </Text>
      </View>

      <View style={[styles.statusCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? Colors.success : Colors.warning },
            ]}
          />
          <Text style={[styles.statusLabel, { color: Colors.text }]}>
            {conversation.status.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.speaking, { color: Colors.lightText }]}>
          Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}
        </Text>
      </View>

      <View style={[styles.actionCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isConnected ? (Colors.error || '#FF3B30') : Colors.primary },
          ]}
          onPress={isConnected ? endConversation : startConversation}
        >
          <Text style={styles.buttonText}>
            {isConnected ? 'End Conversation' : 'Start Conversation'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.helperText, { color: Colors.lightText }]}>
          Tap to {isConnected ? 'end the session' : 'start a live interview'}.
        </Text>
      </View>

      {conversation.canSendFeedback && (
        <View style={styles.feedbackContainer}>
          <Text style={[styles.feedbackTitle, { color: Colors.text }]}>
            How was the response?
          </Text>
          <View style={styles.feedbackButtons}>
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                { backgroundColor: Colors.card, borderColor: Colors.border },
              ]}
              onPress={() => conversation.sendFeedback(true)}
            >
              <Text style={[styles.feedbackText, { color: Colors.text }]}>👍 Good</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                { backgroundColor: Colors.card, borderColor: Colors.border },
              ]}
              onPress={() => conversation.sendFeedback(false)}
            >
              <Text style={[styles.feedbackText, { color: Colors.text }]}>👎 Needs work</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
function App() {
  return (
    <ElevenLabsProvider>
      <ConversationScreen />
    </ElevenLabsProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 20,
    paddingTop: 32,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  speaking: {
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
  },
  feedbackContainer: {
    gap: 12,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  feedbackButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
export default App;
