import { supabase } from "@/lib/supabase";
import { useAppStateStore } from "@/store/appStateStore";
import { useDocumentStore } from "@/store/documentStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";

export function clearAuthenticatedSessionState() {
  useUserStore.getState().logout();
  useJourneyStore.getState().resetForSignOut();
  useDocumentStore.getState().resetForSignOut();
  useAppStateStore.setState({
    hasBootstrappedNavigation: false,
    inCriticalFlow: false,
  });
}

export async function signOutAndClearSession() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out failed:", error);
    }
  } catch (error) {
    console.error("Sign out failed:", error);
  } finally {
    clearAuthenticatedSessionState();
  }
}
