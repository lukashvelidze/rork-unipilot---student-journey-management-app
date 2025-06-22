import React from "react";
import { StyleSheet, View, Text } from "react-native";
import Colors from "@/constants/colors";
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
    <Card style={[styles.card, getVariantStyle()]}>
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteMarks}>"</Text>
        <Text style={[styles.quoteText, getQuoteStyle()]}>{quote}</Text>
        <Text style={styles.quoteMarks}>"</Text>
      </View>
      <Text style={[styles.authorText, getAuthorStyle()]}>— {author}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    padding: 16,
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
    shadowColor: "transparent",
    elevation: 0,
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
  quoteText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 8,
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
    fontSize: 14,
    textAlign: "right",
    marginTop: 8,
  },
  defaultAuthor: {
    color: Colors.lightText,
  },
  highlightAuthor: {
    color: Colors.primary,
    fontWeight: "600",
  },
  minimalAuthor: {
    color: Colors.lightText,
  },
});

export default QuoteCard;