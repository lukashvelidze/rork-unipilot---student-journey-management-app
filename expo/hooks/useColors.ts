import { useThemeStore } from "@/store/themeStore";
import { lightColors, darkColors } from "@/constants/colors";

export const useColors = () => {
  const { isDarkMode } = useThemeStore();
  return isDarkMode ? darkColors : lightColors;
};