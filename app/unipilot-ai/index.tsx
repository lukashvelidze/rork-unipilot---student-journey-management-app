import React, { useState, useRef, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Send, Crown, Lock } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import Button from "@/components/Button";
import Card from "@/components/Card";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export default function UniPilotAIScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user } = useUserStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setHasActiveSubscription(false);
          setIsCheckingSubscription(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", authUser.id)
          .single();

        const tier = profile?.subscription_tier === "premium" ? "pro" : profile?.subscription_tier;
        const isSubscribed = tier && tier !== "free" && ["basic", "standard", "pro", "premium"].includes(tier);
        setHasActiveSubscription(!!isSubscribed);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasActiveSubscription(false);
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, []);

  // Show premium wall if not subscribed
  if (isCheckingSubscription) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.lightText }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: Colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.premiumWallContainer}>
          <Card style={[styles.premiumCard, { backgroundColor: Colors.card }]}>
            <View style={styles.premiumIconContainer}>
              <Lock size={48} color={Colors.primary} />
            </View>
            <Text style={[styles.premiumTitle, { color: Colors.text }]}>
              Premium Feature
            </Text>
            <Text style={[styles.premiumDescription, { color: Colors.lightText }]}>
              AI Assistant is available with a premium subscription. Get personalized guidance and answers from our AI assistant.
            </Text>
            <View style={styles.premiumFeatures}>
              <View style={styles.premiumFeature}>
                <Crown size={20} color={Colors.primary} />
                <Text style={[styles.premiumFeatureText, { color: Colors.text }]}>
                  Unlimited AI conversations
                </Text>
              </View>
              <View style={styles.premiumFeature}>
                <Crown size={20} color={Colors.primary} />
                <Text style={[styles.premiumFeatureText, { color: Colors.text }]}>
                  Personalized guidance for your journey
                </Text>
              </View>
              <View style={styles.premiumFeature}>
                <Crown size={20} color={Colors.primary} />
                <Text style={[styles.premiumFeatureText, { color: Colors.text }]}>
                  Access to interview simulator and more
                </Text>
              </View>
            </View>
            <Button
              title="View Premium Plans"
              onPress={() => router.push("/premium")}
              icon={<Crown size={20} color="#FFFFFF" />}
              fullWidth
              style={styles.upgradeButton}
            />
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={[styles.backButtonText, { color: Colors.lightText }]}>
                Go Back
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: message.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

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
              Ask me anything about studying abroad
            </Text>
          </View>
        </View>
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
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ECF0F1",
    backgroundColor: "#FFFFFF",
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
    color: "#2C3E50",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  upgradeButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
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
    backgroundColor: "#FF6B6B",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  aiMessageText: {
    color: "#2C3E50",
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
    color: "#2C3E50",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ECF0F1",
    backgroundColor: "#FFFFFF",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ECF0F1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2C3E50",
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: "#FF6B6B",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7F8C8D",
  },
  premiumWallContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  premiumCard: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    alignItems: "center",
  },
  premiumIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#2C3E50",
  },
  premiumDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    color: "#7F8C8D",
  },
  premiumFeatures: {
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  premiumFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumFeatureText: {
    fontSize: 14,
    flex: 1,
    color: "#2C3E50",
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
    textAlign: "center",
    color: "#7F8C8D",
  },
});
