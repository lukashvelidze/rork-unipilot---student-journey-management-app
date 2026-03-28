import { useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";

const DEFAULT_FALLBACK = "/(tabs)";

export function useAppBack(fallbackRoute: string = DEFAULT_FALLBACK) {
  const router = useRouter();
  const navigation = useNavigation();

  return useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (typeof router.canGoBack === "function" && router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute as any);
  }, [navigation, router, fallbackRoute]);
}
