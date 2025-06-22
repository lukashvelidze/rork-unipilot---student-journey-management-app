import { Platform } from "react-native";

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const calculateOverallProgress = (stageProgresses: { progress: number }[]): number => {
  if (stageProgresses.length === 0) return 0;
  
  const totalProgress = stageProgresses.reduce((sum, stage) => sum + stage.progress, 0);
  return Math.round(totalProgress / stageProgresses.length);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";

export const getInitials = (name: string): string => {
  if (!name) return "";
  
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getRandomTip = (tips: string[]): string => {
  const randomIndex = Math.floor(Math.random() * tips.length);
  return tips[randomIndex];
};

export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
};

export const getDocumentStatusColor = (status: string): string => {
  switch (status) {
    case "valid":
      return "#4CAF50"; // Green
    case "expiring_soon":
      return "#FFC107"; // Yellow
    case "expired":
      return "#FF5252"; // Red
    case "pending":
      return "#757575"; // Gray
    default:
      return "#757575"; // Gray
  }
};

export const getTopicColor = (topic: string): string => {
  const topicColors: Record<string, string> = {
    visa: "#4A90E2", // Blue
    university: "#9C27B0", // Purple
    accommodation: "#4CAF50", // Green
    finances: "#FF9800", // Orange
    culture: "#E91E63", // Pink
    academics: "#3F51B5", // Indigo
    career: "#009688", // Teal
    general: "#607D8B", // Blue Gray
  };
  
  return topicColors[topic] || "#607D8B";
};