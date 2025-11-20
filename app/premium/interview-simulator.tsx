import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Mic, MicOff, PhoneOff, ArrowLeft, Volume2, VolumeX, AlertCircle } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "@/components/Card";
import { useUserStore } from "@/store/userStore";
import Constants from "expo-constants";

// Conditionally import ElevenLabs hooks - they require native modules
let useConversation: any = null;
let isElevenLabsAvailable = false;
try {
  const elevenLabsModule = require("@elevenlabs/react-native");
  useConversation = elevenLabsModule.useConversation;
  isElevenLabsAvailable = true;
} catch (error) {
  console.log("ElevenLabs SDK not available");
}

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === "storeClient";

export default function InterviewSimulatorScreen() {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUserStore();

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; type: "user" | "agent" | "system" }>>([]);

  // Get agent ID from environment variable or use placeholder
  // TODO: Replace with your actual ElevenLabs agent ID
  const AGENT_ID = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID || "your-agent-id-here";

  // Show error if ElevenLabs is not available (Expo Go)
  if (!isElevenLabsAvailable || isExpoGo) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background, paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            title: "Interview Simulator",
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: 8 }}
              >
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconContainer, { backgroundColor: Colors.error + "20" || "#FF3B3020" }]}>
            <AlertCircle size={48} color={Colors.error || "#FF3B30"} />
          </View>
          <Text style={[styles.errorTitle, { color: Colors.text }]}>
            Development Build Required
          </Text>
          <Text style={[styles.errorText, { color: Colors.lightText }]}>
            The Interview Simulator requires native modules and cannot run in Expo Go.
          </Text>
          <Text style={[styles.errorText, { color: Colors.lightText, marginTop: 12 }]}>
            Please build a development build using:
          </Text>
          <View style={[styles.codeBlock, { backgroundColor: Colors.card }]}>
            <Text style={[styles.codeText, { color: Colors.text }]}>
              npx expo run:ios
            </Text>
            <Text style={[styles.codeText, { color: Colors.text, marginTop: 8 }]}>
              npx expo run:android
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: Colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to conversation");
      setIsConnected(true);
      addMessage("system", "Connected to interview simulator. The agent is ready to start.");
    },
    onDisconnect: () => {
      console.log("Disconnected from conversation");
      setIsConnected(false);
      addMessage("system", "Disconnected from interview simulator.");
    },
    onMessage: (message: any) => {
      console.log("Message received:", message);
      // Handle different message types from ElevenLabs SDK
      // The message structure may vary, so we handle multiple possible formats
      const messageText = message.text || message.content || message.message || "";
      const messageType = message.type || message.role || "";
      
      if (messageType === "user" || messageType === "user_transcript" || messageType === "user_message") {
        if (messageText) {
          addMessage("user", messageText);
        }
      } else if (messageType === "agent" || messageType === "assistant" || messageType === "agent_response") {
        if (messageText) {
          addMessage("agent", messageText);
        }
      } else if (messageType === "debug" || messageType === "system") {
        // Optionally show debug messages
        console.log("Debug:", messageText);
      } else if (messageText) {
        // Fallback: if we have text but unknown type, show it as agent message
        addMessage("agent", messageText);
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      Alert.alert("Error", error.message || "An error occurred during the conversation.");
    },
    onModeChange: (mode) => {
      console.log("Conversation mode changed:", mode);
    },
    onStatusChange: (prop) => {
      console.log("Conversation status changed:", prop.status);
    },
  });

  const addMessage = (type: "user" | "agent" | "system", text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(),
        text,
        type,
      },
    ]);
  };

  const requestMicrophonePermission = async () => {
    setIsRequestingPermission(true);
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "UniPilot needs microphone access to enable voice conversations for interview practice.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        // iOS permissions are handled automatically when starting the session
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
      Alert.alert("Error", "Failed to request microphone permission.");
    } finally {
      setIsRequestingPermission(false);
    }
  };

  useEffect(() => {
    // Request permission on mount
    if (Platform.OS === "android") {
      requestMicrophonePermission();
    } else {
      setHasPermission(true);
    }
  }, []);

  const startConversation = async () => {
    if (!hasPermission && Platform.OS === "android") {
      Alert.alert(
        "Microphone Permission Required",
        "Please grant microphone permission to start the interview simulator.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant Permission", onPress: requestMicrophonePermission },
        ]
      );
      return;
    }

    if (AGENT_ID === "your-agent-id-here") {
      Alert.alert(
        "Configuration Required",
        "Please configure your ElevenLabs agent ID in the environment variables (EXPO_PUBLIC_ELEVENLABS_AGENT_ID)."
      );
      return;
    }

    try {
      setMessages([]);
      await conversation.startSession({
        agentId: AGENT_ID,
        userId: user?.id || "anonymous",
      });
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      Alert.alert("Error", error.message || "Failed to start the interview simulator. Please try again.");
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
      setMessages([]);
    } catch (error: any) {
      console.error("Failed to end conversation:", error);
      Alert.alert("Error", "Failed to end the conversation. Please try again.");
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    conversation.setMicMuted(newMutedState);
  };

  const sendFeedback = async (liked: boolean) => {
    try {
      await conversation.sendFeedback(liked);
      Alert.alert("Thank you!", "Your feedback helps us improve the interview simulator.");
    } catch (error) {
      console.error("Failed to send feedback:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background, paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: "Interview Simulator",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.primary + "20" }]}>
            <Mic size={32} color={Colors.primary} />
          </View>
          <Text style={[styles.title, { color: Colors.text }]}>Interview Simulator</Text>
          <Text style={[styles.subtitle, { color: Colors.lightText }]}>
            Practice visa and university interviews with AI-powered simulations
          </Text>
        </View>

        {/* Status Card */}
        <Card style={[styles.statusCard, { backgroundColor: Colors.card }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: isConnected ? Colors.success : Colors.lightText + "40" }]} />
            <Text style={[styles.statusText, { color: Colors.text }]}>
              {isConnected ? "Connected" : "Disconnected"}
            </Text>
            {conversation.isSpeaking && (
              <View style={styles.speakingIndicator}>
                <Volume2 size={16} color={Colors.primary} />
                <Text style={[styles.speakingText, { color: Colors.primary }]}>Agent Speaking</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Messages Area */}
        <Card style={[styles.messagesCard, { backgroundColor: Colors.card }]}>
          <Text style={[styles.messagesTitle, { color: Colors.text }]}>Conversation</Text>
          <View style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <View style={styles.emptyMessages}>
                <Text style={[styles.emptyText, { color: Colors.lightText }]}>
                  {isConnected
                    ? "Start speaking to begin the interview..."
                    : "Start a conversation to see messages here"}
                </Text>
              </View>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.type === "user" && styles.userMessage,
                    message.type === "agent" && styles.agentMessage,
                    message.type === "system" && styles.systemMessage,
                    message.type === "user" && { backgroundColor: Colors.primary + "20" },
                    message.type === "agent" && { backgroundColor: Colors.card },
                    message.type === "system" && { backgroundColor: Colors.lightText + "10" },
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      { color: message.type === "system" ? Colors.lightText : Colors.text },
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              ))
            )}
          </View>
        </Card>

        {/* Controls */}
        <View style={styles.controls}>
          {!isConnected ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
              onPress={startConversation}
              disabled={isRequestingPermission}
            >
              {isRequestingPermission ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Mic size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Start Interview</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: Colors.card, borderColor: Colors.primary }]}
                onPress={toggleMute}
              >
                {isMuted ? (
                  <>
                    <MicOff size={20} color={Colors.primary} />
                    <Text style={[styles.secondaryButtonText, { color: Colors.primary }]}>Unmute</Text>
                  </>
                ) : (
                  <>
                    <Mic size={20} color={Colors.primary} />
                    <Text style={[styles.secondaryButtonText, { color: Colors.primary }]}>Mute</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerButton, { backgroundColor: Colors.error || "#FF3B30" }]}
                onPress={endConversation}
              >
                <PhoneOff size={20} color="#FFFFFF" />
                <Text style={styles.dangerButtonText}>End Interview</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Feedback Section */}
        {conversation.canSendFeedback && isConnected && (
          <Card style={[styles.feedbackCard, { backgroundColor: Colors.card }]}>
            <Text style={[styles.feedbackTitle, { color: Colors.text }]}>How was your experience?</Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                style={[styles.feedbackButton, { backgroundColor: Colors.success + "20" }]}
                onPress={() => sendFeedback(true)}
              >
                <Text style={[styles.feedbackButtonText, { color: Colors.success }]}>👍 Good</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedbackButton, { backgroundColor: Colors.error + "20" || "#FF3B3020" }]}
                onPress={() => sendFeedback(false)}
              >
                <Text style={[styles.feedbackButtonText, { color: Colors.error || "#FF3B30" }]}>👎 Needs Improvement</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  statusCard: {
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  speakingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  speakingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  messagesCard: {
    flex: 1,
    padding: 16,
    marginBottom: 16,
    minHeight: 200,
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  messagesContainer: {
    flex: 1,
    gap: 12,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: "85%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  agentMessage: {
    alignSelf: "flex-start",
  },
  systemMessage: {
    alignSelf: "center",
    maxWidth: "100%",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  controls: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  feedbackCard: {
    padding: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: 12,
  },
  feedbackButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  codeBlock: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
    width: "100%",
  },
  codeText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

