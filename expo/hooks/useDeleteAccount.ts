import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSignOut } from "@/hooks/useSignOut";

/**
 * Confirmed, permanent account deletion (Settings and Edit Profile).
 * Rows that reference auth.users with ON DELETE CASCADE (journeys, tasks,
 * bookmarks, interview sessions) go with the auth user.
 */
export function useDeleteAccount() {
  const signOut = useSignOut();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const deleteAccount = useCallback(async () => {
    setIsDeletingAccount(true);
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !authUser) throw new Error(authError?.message || "Not authenticated");

      const userId = authUser.id;
      const deletionResults = await Promise.allSettled([
        supabase.from("memories").delete().eq("user_id", userId),
        supabase.from("documents").delete().eq("user_id", userId),
        supabase.from("user_progress").delete().eq("user_id", userId),
        supabase.from("user_subscriptions").delete().eq("user_id", userId),
        supabase.from("user_subscription_status").delete().eq("user_id", userId),
      ]);
      deletionResults.forEach((result) => {
        if (result.status === "rejected") console.warn("Failed to delete user data:", result.reason);
      });

      // Remove profile entry last
      await supabase.from("profiles").delete().eq("id", userId);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Missing auth session");
      if (session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshed?.session) {
          throw refreshError || new Error("Failed to refresh auth session");
        }
      }

      const { error: deleteError } = await supabase.functions.invoke("delete-user");
      if (deleteError) throw deleteError;

      await signOut();
      Alert.alert("Account Deleted", "Your account has been deleted.", [{ text: "OK" }]);
    } catch (error: any) {
      console.error("Delete account error:", error);
      Alert.alert("Error", error?.message || "Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  }, [signOut]);

  const confirmDeleteAccount = useCallback(() => {
    if (isDeletingAccount) return;
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount },
      ],
    );
  }, [deleteAccount, isDeletingAccount]);

  return { confirmDeleteAccount, isDeletingAccount };
}
