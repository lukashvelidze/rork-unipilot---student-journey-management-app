import { Dimensions } from "react-native";
import Colors from "./colors";

const { width, height } = Dimensions.get("window");

export default {
  colors: Colors,
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    xxl: 32,
  },
  fontSize: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  shadow: {
    small: {
      shadowColor: Colors.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: Colors.shadowMedium,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: Colors.shadowDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  dimensions: {
    width,
    height,
  },
  // Modern design elements
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: Colors.card,
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  // Typography
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 16,
    },
    h2: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 12,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600",
      color: Colors.text,
      marginBottom: 8,
    },
    body: {
      fontSize: 16,
      color: Colors.text,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      color: Colors.lightText,
    },
    button: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.white,
    },
  },
};