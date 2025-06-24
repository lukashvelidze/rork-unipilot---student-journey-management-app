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
    xxxl: 64,
  },
  borderRadius: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontSize: {
    xs: 11,
    s: 13,
    m: 15,
    l: 17,
    xl: 19,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  fontWeight: {
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  shadow: {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: Colors.shadowLight,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: Colors.shadowMedium,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 3,
    },
    large: {
      shadowColor: Colors.shadowDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 6,
    },
    xl: {
      shadowColor: Colors.shadowDark,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 10,
    },
  },
  dimensions: {
    width,
    height,
  },
  // Futuristic design elements
  card: {
    default: {
      borderRadius: 16,
      padding: 20,
      backgroundColor: Colors.card,
      ...{
        shadowColor: Colors.shadowMedium,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
      },
    },
    elevated: {
      borderRadius: 20,
      padding: 24,
      backgroundColor: Colors.card,
      ...{
        shadowColor: Colors.shadowDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 6,
      },
    },
    glass: {
      borderRadius: 20,
      padding: 20,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(10px)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
  },
  // Modern typography system
  typography: {
    display: {
      fontSize: 40,
      fontWeight: "800",
      color: Colors.text,
      lineHeight: 48,
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: 32,
      fontWeight: "700",
      color: Colors.text,
      lineHeight: 40,
      letterSpacing: -0.25,
    },
    h2: {
      fontSize: 24,
      fontWeight: "600",
      color: Colors.text,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600",
      color: Colors.text,
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: "600",
      color: Colors.text,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: "400",
      color: Colors.text,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: "500",
      color: Colors.text,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: "400",
      color: Colors.lightText,
      lineHeight: 20,
    },
    captionMedium: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors.lightText,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: "400",
      color: Colors.mutedText,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 20,
    },
  },
  // Interactive elements
  button: {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      minHeight: 36,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      minHeight: 48,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
      minHeight: 56,
    },
  },
  input: {
    default: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      fontSize: 16,
    },
    large: {
      height: 56,
      borderRadius: 16,
      paddingHorizontal: 20,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      fontSize: 16,
    },
  },
  // Badge system
  badge: {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      fontSize: 10,
      fontWeight: "600",
    },
    medium: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      fontSize: 12,
      fontWeight: "600",
    },
    large: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      fontSize: 14,
      fontWeight: "600",
    },
  },
  // Layout helpers
  section: {
    marginBottom: 32,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 20,
  },
  // Animation values
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  // Gradient definitions
  gradients: {
    primary: {
      colors: [Colors.gradientStart, Colors.gradientEnd],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    surface: {
      colors: ["rgba(255, 255, 255, 0.9)", "rgba(248, 250, 252, 0.9)"],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
  },
};