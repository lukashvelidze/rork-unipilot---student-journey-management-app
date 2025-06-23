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

  // Rest of the component code remains the same...
  // Only the premium status handling logic has been updated