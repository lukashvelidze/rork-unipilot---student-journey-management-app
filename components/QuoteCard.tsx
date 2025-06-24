import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Quote } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import Card from "./Card";

interface QuoteCardProps {
  quote: string;
  author: string;
  variant?: "default" | "highlight" | "gradient";
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, author, variant = "default" }) => {
  const Colors = useColors();

  if (variant === "gradient") {
    return (
      <Card style={styles.gradientCard}>
        <LinearGradient
          colors={[Colors.memoryPink, Colors.memoryPurple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.quoteHeader}>
            <Quote size={24} color="#FFFFFF" />
            <Text style={styles.gradientQuoteText}>Daily Inspiration</Text>
          </View>
          <Text style={styles.gradientQuote}>"{quote}"</Text>
          <Text style={styles.gradientAuthor}>— {author}</Text>
        </LinearGradient>
      </Card>
    );
  }

  if (variant === "highlight") {
    return (
      <Card style={[styles.highlightCard, { backgroundColor: Colors.card }]}>
        <LinearGradient
          colors={[Colors.primary + "10", Colors.secondary + "10"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.highlightBackground}
        >
          <View style={styles.quoteHeader}>
            <Quote size={20} color={Colors.primary} />
            <Text style={[styles.quoteLabel, { color: Colors.primary }]}>Daily Inspiration</Text>
          </View>
          <Text style={[styles.quote, { color: Colors.text }]}>"{quote}"</Text>
          <Text style={[styles.author, { color: Colors.lightText }]}>— {author}</Text>
        </LinearGradient>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: Colors.card, borderLeftColor: Colors.primary }]}>
      <View style={styles.quoteHeader}>
        <Quote size={20} color={Colors.primary} />
        <Text style={[styles.quoteLabel, { color: Colors.primary }]}>Daily Inspiration</Text>
      </View>
      <Text style={[styles.quote, { color: Colors.text }]}>"{quote}"</Text>
      <Text style={[styles.author, { color: Colors.lightText }]}>— {author}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderLeftWidth: 4,
    padding: 20,
  },
  highlightCard: {
    marginBottom: 16,
    padding: 0,
    overflow: "hidden",
  },
  gradientCard: {
    marginBottom: 16,
    padding: 0,
    overflow: "hidden",
  },
  highlightBackground: {
    padding: 20,
  },
  gradientBackground: {
    padding: 24,
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  quoteLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  quote: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 12,
  },
  gradientQuoteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  gradientQuote: {
    fontSize: 18,
    lineHeight: 26,
    fontStyle: "italic",
    color: "#FFFFFF",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  author: {
    fontSize: 14,
    fontWeight: "500",
  },
  gradientAuthor: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
  },
});

export default QuoteCard;