import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Crown, Check, MessageCircle, Send, Lock } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";

export default function PremiumScreen() {
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [message, setMessage] = useState("");
  
  const handlePromoCodeSubmit = () => {
    if (promoCode.toLowerCase() === "admin") {
      setIsPremium(true);
      Alert.alert(
        "Success",
        "Promo code applied! You now have access to UniPilot Premium features.",
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
  
  const handleSubscribe = () => {
    Alert.alert(
      "Subscribe to UniPilot Premium",
      "This will start your subscription at $4.99/month after a 7-day free trial.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Subscribe",
          onPress: () => {
            setIsPremium(true);
            Alert.alert(
              "Subscription Successful",
              "Welcome to UniPilot Premium! You now have access to all premium features.",
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
  };
  
  const handleSendMessage = () => {
    if (message.trim()) {
      Alert.alert(
        "Message Sent",
        "An expert will respond to your message shortly.",
        [
          {
            text: "OK",
            onPress: () => setMessage(""),
          },
        ]
      );
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Crown size={32} color="#FFD700" style={styles.crownIcon} />
        <Text style={styles.title}>UniPilot Premium</Text>
        <Text style={styles.subtitle}>Expert guidance for your international education journey</Text>
      </View>
      
      {!isPremium ? (
        <View style={styles.subscriptionSection}>
          <Card style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Unlock Premium Features</Text>
            <Text style={styles.price}>$4.99<Text style={styles.perMonth}>/month</Text></Text>
            <Text style={styles.trialText}>7-day free trial, cancel anytime</Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>1-on-1 expert consultations</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>Visa application guides & templates</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>University application assistance</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>Personalized study abroad roadmap</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>Priority support for all questions</Text>
              </View>
            </View>
            
            <Button
              title="Subscribe Now"
              onPress={handleSubscribe}
              style={styles.subscribeButton}
              fullWidth
            />
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.promoContainer}>
              <Text style={styles.promoLabel}>Have a promo code?</Text>
              <View style={styles.promoInputContainer}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Enter promo code"
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
            </View>
          </Card>
          
          <View style={styles.testimonialSection}>
            <Text style={styles.testimonialTitle}>What Students Say</Text>
            
            <Card style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
                  style={styles.testimonialAvatar}
                />
                <View>
                  <Text style={styles.testimonialName}>Sarah Chen</Text>
                  <Text style={styles.testimonialInfo}>Harvard University, USA</Text>
                </View>
              </View>
              <Text style={styles.testimonialContent}>
                "The expert guidance from UniPilot Premium was invaluable during my visa application process. They helped me prepare for my interview and all my documents were approved on the first try!"
              </Text>
            </Card>
            
            <Card style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
                  style={styles.testimonialAvatar}
                />
                <View>
                  <Text style={styles.testimonialName}>Miguel Rodriguez</Text>
                  <Text style={styles.testimonialInfo}>University of Toronto, Canada</Text>
                </View>
              </View>
              <Text style={styles.testimonialContent}>
                "Worth every penny! The personalized roadmap helped me stay on track with my applications, and the expert advice on scholarship applications helped me secure funding."
              </Text>
            </Card>
          </View>
        </View>
      ) : (
        <View style={styles.premiumContent}>
          <Card style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome to Premium!</Text>
            <Text style={styles.welcomeText}>
              You now have access to all premium features including expert consultations, visa guides, and personalized assistance.
            </Text>
          </Card>
          
          <View style={styles.expertSection}>
            <Text style={styles.sectionTitle}>Talk to an Expert</Text>
            <Card style={styles.chatCard}>
              <View style={styles.chatHeader}>
                <View style={styles.expertInfo}>
                  <Image
                    source={{ uri: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
                    style={styles.expertAvatar}
                  />
                  <View>
                    <Text style={styles.expertName}>Dr. Emma Wilson</Text>
                    <Text style={styles.expertTitle}>International Education Advisor</Text>
                  </View>
                </View>
                <View style={styles.onlineIndicator} />
              </View>
              
              <View style={styles.chatMessages}>
                <View style={styles.expertMessage}>
                  <Text style={styles.messageText}>
                    Hello! I'm Dr. Wilson, your personal education advisor. How can I help with your international study plans today?
                  </Text>
                  <Text style={styles.messageTime}>Just now</Text>
                </View>
              </View>
              
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type your message..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !message.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <Send size={20} color={message.trim() ? Colors.white : Colors.lightText} />
                </TouchableOpacity>
              </View>
            </Card>
          </View>
          
          <View style={styles.resourcesSection}>
            <Text style={styles.sectionTitle}>Premium Resources</Text>
            
            <TouchableOpacity style={styles.resourceCard}>
              <View style={styles.resourceIcon}>
                <Lock size={24} color={Colors.primary} />
              </View>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>Visa Application Guide</Text>
                <Text style={styles.resourceDescription}>
                  Step-by-step guide to preparing a successful student visa application
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceCard}>
              <View style={styles.resourceIcon}>
                <Lock size={24} color={Colors.primary} />
              </View>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>Scholarship Application Templates</Text>
                <Text style={styles.resourceDescription}>
                  Winning templates and examples for international scholarship applications
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceCard}>
              <View style={styles.resourceIcon}>
                <Lock size={24} color={Colors.primary} />
              </View>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>University Interview Preparation</Text>
                <Text style={styles.resourceDescription}>
                  Practice questions and expert tips for university admission interviews
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  crownIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightText,
    textAlign: "center",
    maxWidth: "80%",
  },
  subscriptionSection: {
    marginBottom: 24,
  },
  pricingCard: {
    alignItems: "center",
    marginBottom: 24,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  price: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.primary,
  },
  perMonth: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.lightText,
  },
  trialText: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 16,
  },
  featuresContainer: {
    alignSelf: "stretch",
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
  },
  subscribeButton: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: Colors.lightText,
    fontSize: 14,
  },
  promoContainer: {
    width: "100%",
  },
  promoLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
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
  testimonialSection: {
    marginBottom: 24,
  },
  testimonialTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  testimonialCard: {
    marginBottom: 16,
  },
  testimonialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  testimonialInfo: {
    fontSize: 12,
    color: Colors.lightText,
  },
  testimonialContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontStyle: "italic",
  },
  premiumContent: {
    marginBottom: 24,
  },
  welcomeCard: {
    marginBottom: 24,
    backgroundColor: Colors.primaryLight,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  expertSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  chatCard: {
    padding: 0,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expertInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  expertAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  expertName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  expertTitle: {
    fontSize: 12,
    color: Colors.lightText,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  chatMessages: {
    padding: 16,
    minHeight: 120,
  },
  expertMessage: {
    backgroundColor: Colors.lightBackground,
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    maxWidth: "80%",
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.lightText,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.lightBackground,
  },
  resourcesSection: {
    marginBottom: 24,
  },
  resourceCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: Colors.lightText,
    lineHeight: 20,
  },
});