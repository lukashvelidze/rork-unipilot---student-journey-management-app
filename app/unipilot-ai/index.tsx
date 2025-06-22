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
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Send, Crown, Lock, Image as ImageIcon, Mic, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useUserStore } from "@/store/userStore";
import Card from "@/components/Card";

// Message types
type MessageType = "text" | "image" | "loading";

interface Message {
  id: string;
  content: string;
  type: MessageType;
  sender: "user" | "ai";
  timestamp: Date;
}

export default function UniPilotAIScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: `Hello ${user?.name || "there"}! I'm your UniPilot AI Assistant. I can help you with university applications, visa processes, accommodation, and more. How can I assist you today?`,
        type: "text",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [user?.name]);

  const handleSend = () => {
    if (!message.trim()) return;

    // Check if user has reached free message limit
    if (!isPremium && messageCount >= 3) {
      showPremiumAlert();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      type: "text",
      sender: "user",
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      content: "",
      type: "loading",
      sender: "ai",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setMessage("");
    setMessageCount((prev) => prev + 1);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(message);
      setMessages((prev) => 
        prev.filter(msg => msg.type !== "loading").concat({
          id: `ai-${Date.now()}`,
          content: aiResponse,
          type: "text",
          sender: "ai",
          timestamp: new Date(),
        })
      );
    }, 1500);
  };

  const generateAIResponse = (userMessage: string) => {
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (lowerCaseMessage.includes("visa") || lowerCaseMessage.includes("document")) {
      return "For visa applications, you'll need to prepare your passport, admission letter, financial documents, and complete the appropriate visa application form. Would you like me to provide a detailed checklist for your specific destination country?";
    } else if (lowerCaseMessage.includes("university") || lowerCaseMessage.includes("application")) {
      return "University applications typically require transcripts, recommendation letters, standardized test scores, and a personal statement. The specific requirements vary by institution. Would you like tips on writing an effective personal statement?";
    } else if (lowerCaseMessage.includes("accommodation") || lowerCaseMessage.includes("housing")) {
      return "When looking for student accommodation, consider on-campus housing, private rentals, or homestays. Each option has different costs and benefits. What's your budget and preferred living arrangement?";
    } else if (lowerCaseMessage.includes("scholarship") || lowerCaseMessage.includes("financial")) {
      return "There are many scholarship opportunities for international students. These can be merit-based, need-based, or country-specific. Would you like me to suggest some scholarship search platforms?";
    } else if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
      return `Hello! I'm your UniPilot AI Assistant. I can help with university applications, visa processes, accommodation, and more. What specific information are you looking for today?`;
    } else {
      return "I understand you're interested in studying abroad. Could you provide more specific details about what you need help with? I can assist with university selection, application processes, visa requirements, accommodation options, and more.";
    }
  };

  const handlePromoCodeSubmit = () => {
    if (promoCode.toLowerCase() === "admin") {
      setIsPremium(true);
      setShowPromoInput(false);
      Alert.alert(
        "Success",
        "Promo code applied! You now have unlimited access to UniPilot AI Assistant.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Invalid Code",
        "The promo code you entered is not valid. Please try again or subscribe to access premium features.",
        [{ text: "OK" }]
      );
    }
  };

  const showPremiumAlert = () => {
    Alert.alert(
      "Message Limit Reached",
      "You've reached the free message limit. Upgrade to UniPilot Premium for unlimited AI assistance.",
      [
        {
          text: "Enter Promo Code",
          onPress: () => setShowPromoInput(true),
        },
        {
          text: "Subscribe",
          onPress: () => router.push("/premium"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === "loading") {
      return (
        <View style={[styles.messageContainer, styles.aiMessageContainer]}>
          <View style={styles.aiMessage}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        </View>
      );
    }

    if (item.sender === "user") {
      return (
        <View style={[styles.messageContainer, styles.userMessageContainer]}>
          <View style={styles.userMessage}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={[styles.messageContainer, styles.aiMessageContainer]}>
          <View style={styles.aiMessage}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        </View>
      );
    }
  };

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
              {isPremium ? "Premium Access" : `${3 - messageCount} free messages left`}
            </Text>
          </View>
        </View>
        {!isPremium && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/premium")}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {showPromoInput ? (
        <Card style={styles.promoCard}>
          <View style={styles.promoHeader}>
            <Text style={styles.promoTitle}>Enter Promo Code</Text>
            <TouchableOpacity onPress={() => setShowPromoInput(false)}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.promoInputContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter your promo code"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[
                styles.promoButton,
                !promoCode.trim() && styles.promoButtonDisabled,
              ]}
              onPress={handlePromoCodeSubmit}
              disabled={!promoCode.trim()}
            >
              <Text style={styles.promoButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {!isPremium && messageCount >= 3 ? (
        <View style={styles.premiumBanner}>
          <Lock size={16} color={Colors.white} style={styles.lockIcon} />
          <Text style={styles.premiumBannerText}>
            Upgrade to UniPilot Premium for unlimited AI assistance
          </Text>
          <TouchableOpacity
            style={styles.premiumBannerButton}
            onPress={() => router.push("/premium")}
          >
            <Text style={styles.premiumBannerButtonText}>$4.99/mo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything about studying abroad..."
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <View style={styles.inputActions}>
              {isPremium && (
                <>
                  <TouchableOpacity style={styles.inputActionButton}>
                    <ImageIcon size={20} color={Colors.lightText} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inputActionButton}>
                    <Mic size={20} color={Colors.lightText} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !message.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!message.trim()}
              >
                <Send size={20} color={message.trim() ? Colors.white : Colors.lightText} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: Colors.card,
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
    fontWeight: "700",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.lightText,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  promoCard: {
    margin: 16,
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  promoInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  promoButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  promoButtonDisabled: {
    backgroundColor: Colors.lightBackground,
  },
  promoButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  aiMessageContainer: {
    alignSelf: "flex-start",
  },
  userMessage: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  aiMessage: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 100,
    maxHeight: 100,
    fontSize: 14,
  },
  inputActions: {
    position: "absolute",
    right: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  inputActionButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.lightBackground,
  },
  premiumBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lockIcon: {
    marginRight: 8,
  },
  premiumBannerText: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
  },
  premiumBannerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  premiumBannerButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
});