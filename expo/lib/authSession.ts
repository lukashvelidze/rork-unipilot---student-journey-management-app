import { supabase } from "@/lib/supabase";
import { useAppStateStore } from "@/store/appStateStore";
import { useDocumentStore } from "@/store/documentStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";

let signOutTransitionInProgress = false;

export function isSignOutTransitionInProgress() {
  return signOutTransitionInProgress;
}

export function clearAuthenticatedSessionState() {
  useUserStore.getState().logout();
  useJourneyStore.getState().resetForSignOut();
  useDocumentStore.getState().resetForSignOut();
  useAppStateStore.setState({
    hasBootstrappedNavigation: false,
    inCriticalFlow: false,
  });
}

export async function signOutAndClearSession(
  navigationSettled?: Promise<void>,
) {
  signOutTransitionInProgress = Boolean(navigationSettled);

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out failed:", error);
    }
  } catch (error) {
    console.error("Sign out failed:", error);
  } finally {
    try {
      await navigationSettled;
    } finally {
      clearAuthenticatedSessionState();
      signOutTransitionInProgress = false;
    }
  }
}
