import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Crown, Check, MessageCircle, Send, Lock } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";

export default function PremiumScreen() {
  const router = useRouter();
  const { isPremium, setPremium } = useUserStore();
  const [promoCode, setPromoCode] = useState("");
  const [message, setMessage] = useState("");
  
  const handlePromoCodeSubmit = () => {
    if (promoCode.toLowerCase() === "admin") {
      setPremium(true);
      Alert.alert(
        "Success",
        "Promo code applied! You now have access to UniPilot Premium features.",
        [{ 
          text: "OK",
          onPress: () => router.back()
        }]
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
            setPremium(true);
            Alert.alert(
              "Subscription Successful",
              "Welcome to UniPilot Premium! You now have access to all premium features.",
              [{ 
                text: "OK",
                onPress: () => router.back()
              }]
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Crown size={28} color="#FFD700" style={styles.crownIcon} />
        <Text style={styles.title}>UniPilot Premium</Text>
        <Text style={styles.subtitle}>Unlock exclusive features for your international student journey</Text>
      </View>
      
      <Image 
        source={{ uri: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
        style={styles.heroImage}
        resizeMode="cover"
      />
      
      <Card style={styles.benefitsCard} variant="elevated" borderRadius="large">
        <Text style={styles.sectionTitle}>Premium Benefits</Text>
        
        <View style={styles.benefitItem}>
          <View style={styles.benefitIcon}>
            <Check size={18} color={Colors.primary} />
          </View>
          <View style={styles.benefitTextContainer}>
            <Text style={styles.benefitTitle}>Personalized Guidance</Text>
            <Text style={styles.benefitDescription}>1-on-1 consultations with education experts</Text>
          </View>
        </View>
        
        <View style={styles.benefitItem}>
          <View style={styles.benefitIcon}>
            <Check size={18} color={Colors.primary} />
          </View>
          <View style={styles.benefitTextContainer}>
            <Text style={styles.benefitTitle}>Visa Application Support</Text>
            <Text style={styles.benefitDescription}>Step-by-step visa application guides</Text>
          </View>
        </View>
        
        <View style={styles.benefitItem}>
          <View style={styles.benefitIcon}>
            <Check size={18} color={Colors.primary} />
          </View>
          <View style={styles.benefitTextContainer}>
            <Text style={styles.benefitTitle}>University Application Templates</Text>
            <Text style={styles.benefitDescription}>Proven templates for successful applications</Text>
          </View>
        </View>
        
        <View style={styles.benefitItem}>
          <View style={styles.benefitIcon}>
            <Check size={18} color={Colors.primary} />
          </View>
          <View style={styles.benefitTextContainer}>
            <Text style={styles.benefitTitle}>Premium AI Assistant</Text>
            <Text style={styles.benefitDescription}>Unlimited access to UniPilot AI for personalized advice</Text>
          </View>
        </View>
      </Card>
      
      <Card style={styles.pricingCard} variant="elevated" borderRadius="large">
        <Text style={styles.sectionTitle}>Subscription Plan</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>$4.99</Text>
          <Text style={styles.perMonth}>/month</Text>
        </View>
        <Text style={styles.trialInfo}>7-day free trial, cancel anytime</Text>
        
        {isPremium ? (
          <View style={styles.activeSubscriptionContainer}>
            <View style={styles.activeBadge}>
              <Crown size={16} color="#FFD700" />
              <Text style={styles.activeBadgeText}>Active Subscription</Text>
            </View>
            <Text style={styles.activeMessage}>You have access to all premium features</Text>
          </View>
        ) : (
          <Button
            title="Start 7-Day Free Trial"
            onPress={handleSubscribe}
            variant="primary"
            size="medium"
            fullWidth
            style={styles.subscribeButton}
          />
        )}
      </Card>
      
      {!isPremium && (
        <Card style={styles.promoCard} variant="elevated" borderRadius="large">
          <Text style={styles.sectionTitle}>Have a Promo Code?</Text>
          <TextInput
            style={styles.promoInput}
            placeholder="Enter promo code"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="none"
          />
          <Button
            title="Apply Code"
            onPress={handlePromoCodeSubmit}
            variant="secondary"
            size="medium"
            fullWidth
            style={styles.applyButton}
          />
        </Card>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
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
    paddingVertical: 16,
  },
  crownIcon: {
    marginBottom: 8,
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
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
  },
  benefitsCard: {
    marginBottom: 24,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.lightText,
  },
  pricingCard: {
    marginBottom: 24,
    padding: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
  },
  perMonth: {
    fontSize: 16,
    color: Colors.lightText,
    marginLeft: 4,
  },
  trialInfo: {
    fontSize: 14,
    color: Colors.lightText,
    marginBottom: 20,
  },
  activeSubscriptionContainer: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 8,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  activeBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DAA520",
    marginLeft: 6,
  },
  activeMessage: {
    fontSize: 14,
    color: Colors.text,
    textAlign: "center",
  },
  subscribeButton: {
    marginTop: 8,
  },
  promoCard: {
    marginBottom: 24,
    padding: 20,
  },
  promoInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  applyButton: {
    marginTop: 8,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: Colors.lightText,
    textAlign: "center",
  },
});