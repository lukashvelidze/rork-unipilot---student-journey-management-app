import React from "react";
import { StyleSheet, View, Text } from "react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "./Card";

interface QuoteCardProps {
  quote: string;
  author: string;
  variant?: "default" | "highlight" | "minimal";
}

const QuoteCard: React.FC<QuoteCardProps> = ({ 
  quote, 
  author, 
  variant = "default" 
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "highlight":
        return styles.highlightCard;
      case "minimal":
        return styles.minimalCard;
      default:
        return styles.defaultCard;
    }
  };

  const getQuoteStyle = () => {
    switch (variant) {
      case "highlight":
        return styles.highlightQuote;
      case "minimal":
        return styles.minimalQuote;
      default:
        return styles.defaultQuote;
    }
  };

  const getAuthorStyle = () => {
    switch (variant) {
      case "highlight":
        return styles.highlightAuthor;
      case "minimal":
        return styles.minimalAuthor;
      default:
        return styles.defaultAuthor;
    }
  };

  return (
    <Card 
      style={[styles.card, getVariantStyle()]}
      variant={variant === "minimal" ? "flat" : "default"}
      borderRadius="large"
    >
      <View style={styles.quoteContainer}>
        <Text style={[styles.quoteMarks, variant === "highlight" ? styles.highlightQuoteMarks : null]}>
          "
        </Text>
        <Text style={[styles.quoteText, getQuoteStyle()]}>
          {quote}
        </Text>
      </View>
      <Text style={[styles.authorText, getAuthorStyle()]}>
        — {author}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: Theme.spacing.m,
    padding: Theme.spacing.m,
  },
  defaultCard: {
    backgroundColor: Colors.card,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  highlightCard: {
    backgroundColor: Colors.primaryLight,
  },
  minimalCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  quoteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  quoteMarks: {
    fontSize: 36,
    color: Colors.primary,
    opacity: 0.5,
    lineHeight: 36,
    marginRight: 4,
  },
  highlightQuoteMarks: {
    color: Colors.primary,
    opacity: 0.7,
  },
  quoteText: {
    flex: 1,
    fontSize: Theme.fontSize.m,
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: Theme.spacing.s,
  },
  defaultQuote: {
    color: Colors.text,
  },
  highlightQuote: {
    color: Colors.text,
  },
  minimalQuote: {
    color: Colors.text,
  },
  authorText: {
    fontSize: Theme.fontSize.s,
    textAlign: "right",
    marginTop: Theme.spacing.s,
  },
  defaultAuthor: {
    color: Colors.lightText,
  },
  highlightAuthor: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
  minimalAuthor: {
    color: Colors.lightText,
  },
});

export default QuoteCard;