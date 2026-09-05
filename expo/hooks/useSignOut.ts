import { useCallback } from "react";
import { useRouter } from "expo-router";
import { signOutAndClearSession } from "@/lib/authSession";

export function useSignOut() {
  const router = useRouter();

  return useCallback(async () => {
    await signOutAndClearSession();
    router.dismissAll();
    router.replace("/onboarding/step0-welcome");
  }, [router]);
}
