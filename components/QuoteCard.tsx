import React from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "./Card";

interface QuoteCardProps {
  quote: string;
  author: string;
  variant?: "default" | "highlight" | "minimal";
}

const { width } = Dimensions.get("window");

const QuoteCard: React.FC<QuoteCardProps> = ({ 
  quote, 
  author, 
  variant = "default" 
}) => {
  if (variant === "highlight") {
    return (
      <View style={styles.highlightContainer}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          <View style={styles.highlightContent}>
            <View style={styles.quoteIconContainer}>
              <Text style={styles.quoteIcon}>✨</Text>
            </View>
            <Text style={styles.highlightQuoteText}>
              {quote}
            </Text>
            <View style={styles.authorContainer}>
              <View style={styles.authorLine} />
              <Text style={styles.highlightAuthor}>
                {author}
              </Text>
              <View style={styles.authorLine} />
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (variant === "minimal") {
    return (
      <View style={styles.minimalContainer}>
        <Text style={styles.minimalQuote}>
          "{quote}"
        </Text>
        <Text style={styles.minimalAuthor}>
          — {author}
        </Text>
      </View>
    );
  }

  return (
    <Card style={styles.defaultCard}>
      <View style={styles.defaultContent}>
        <View style={styles.quoteHeader}>
          <View style={styles.quoteMark}>
            <Text style={styles.quoteMarkText}>"</Text>
          </View>
          <View style={styles.decorativeDots}>
            <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
            <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
            <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
          </View>
        </View>
        
        <Text style={styles.defaultQuoteText}>
          {quote}
        </Text>
        
        <View style={styles.defaultAuthorContainer}>
          <View style={styles.authorDivider} />
          <Text style={styles.defaultAuthor}>
            {author}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  // Highlight variant (gradient)
  highlightContainer: {
    marginVertical: Theme.spacing.m,
    borderRadius: 20,
    overflow: "hidden",
    ...Theme.shadow.medium,
  },
  gradientCard: {
    padding: 24,
    minHeight: 140,
    justifyContent: "center",
  },
  highlightContent: {
    alignItems: "center",
  },
  quoteIconContainer: {
    marginBottom: 12,
  },
  quoteIcon: {
    fontSize: 24,
    opacity: 0.9,
  },
  highlightQuoteText: {
    fontSize: 18,
    fontWeight: "500",
    color: Colors.white,
    textAlign: "center",
    lineHeight: 26,
    fontStyle: "italic",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  authorLine: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    flex: 1,
    maxWidth: 40,
  },
  highlightAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
    marginHorizontal: 16,
    opacity: 0.9,
  },

  // Default variant
  defaultCard: {
    marginVertical: Theme.spacing.m,
    backgroundColor: Colors.quoteBackground,
    borderLeftWidth: 4,
    borderLeftColor: Colors.quoteBorder,
    borderRadius: 16,
  },
  defaultContent: {
    padding: 20,
  },
  quoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  quoteMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  quoteMarkText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
    marginTop: -4,
  },
  decorativeDots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  defaultQuoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    fontStyle: "italic",
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  defaultAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorDivider: {
    width: 30,
    height: 2,
    backgroundColor: Colors.quoteAccent,
    marginRight: 12,
    borderRadius: 1,
  },
  defaultAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },

  // Minimal variant
  minimalContainer: {
    marginVertical: Theme.spacing.m,
    paddingHorizontal: 4,
  },
  minimalQuote: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    fontStyle: "italic",
    marginBottom: 8,
  },
  minimalAuthor: {
    fontSize: 14,
    color: Colors.lightText,
    textAlign: "right",
  },
});

export default QuoteCard;