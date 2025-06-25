import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Send, Crown } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useUserStore } from "@/store/userStore";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export default function UniPilotAIScreen() {
  const router = useRouter();
  const { user, isPremium } = useUserStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isUserPremium = isPremium || user?.isPremium || false;

  const showPremiumAlert = () => {
    Alert.alert(
      "Upgrade to Premium",
      "You have reached your free message limit. Upgrade to Premium for unlimited AI assistance.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Subscribe $4.99", onPress: () => router.push("/premium") },
      ]
    );
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    // Check if user has reached free message limit
    if (!isUserPremium && messageCount >= 3) {
      showPremiumAlert();
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: message.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    setMessageCount(prev => prev + 1);

    try {
      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are UniPilot AI, a helpful assistant for international students. Provide guidance on university applications, visa processes, study abroad preparation, and academic success.",
            },
            {
              role: "user",
              content: userMessage.text,
            },
          ],
        }),
      });

      const data = await response.json();

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: data.completion || "I apologize, but I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.aiMessage]}>
      <Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.aiMessageText]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Crown size={24} color="#FFD700" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>UniPilot AI Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {isUserPremium ? "Premium Access" : `${3 - messageCount} free messages left`}
            </Text>
          </View>
        </View>
        {!isUserPremium && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/premium")}
          >
            <Text style={styles.upgradeButtonText}>Subscribe $4.99</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {messages.length === 0 && (
        <View style={styles.emptyState}>
          <Crown size={48} color="#FFD700" />
          <Text style={styles.emptyTitle}>Welcome to UniPilot AI</Text>
          <Text style={styles.emptyDescription}>
            Ask me anything about studying abroad, university applications, visa processes, or academic success!
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Ask me anything about studying abroad..."
          placeholderTextColor={Colors.lightText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!message.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || isLoading}
        >
          <Send size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.lightText,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: Colors.lightBackground,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.white,
  },
  aiMessageText: {
    color: Colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});