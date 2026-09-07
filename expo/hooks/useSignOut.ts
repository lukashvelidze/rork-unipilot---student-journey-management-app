import { useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { signOutAndClearSession } from "@/lib/authSession";

export function useSignOut() {
  const router = useRouter();
  const isSigningOut = useRef(false);

  return useCallback(async () => {
    if (isSigningOut.current) return;
    isSigningOut.current = true;

    const navigationSettled = new Promise<void>((resolve) => {
      setTimeout(resolve, 360);
    });

    router.replace("/onboarding/step0-welcome");
    await signOutAndClearSession(navigationSettled);
  }, [router]);
}
