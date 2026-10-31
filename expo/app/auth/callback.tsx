import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { AlertCircle, Sparkles } from "lucide-react-native";
import Button from "@/components/Button";
import AuthShell from "@/components/auth/AuthShell";
import { ensureProfile, friendlyAuthError, redirectType, sessionFromRedirect } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * Landing route for links in auth emails (unipilot://auth/callback): email
 * confirmation signs the student in, a recovery link opens "Set a new password".
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const [error, setError] = useState("");

  useEffect(() => {
    let handled = false;
    const finish = async (link: string | null) => {
      if (handled) return;
      handled = true;
      try {
        const session = link ? await sessionFromRedirect(link) : null;
        const active = session ?? (await supabase.auth.getSession()).data.session;
        if (!active) throw new Error("This link has expired. Request a new one and try again.");
        if (link && redirectType(link) === "recovery") {
          router.replace("/reset-password" as any);
          return;
        }
        await ensureProfile(active.user);
        router.replace("/onboarding");
      } catch (callbackError) {
        setError(friendlyAuthError(callbackError));
      }
    };

    if (url) finish(url);
    else Linking.getInitialURL().then(finish);
  }, [router, url]);

  if (error) {
    return (
      <AuthShell Icon={AlertCircle} subtitle={error} title="That link didn't work">
        <Button fullWidth onPress={() => router.replace("/sign-in")} style={styles.button} title="Back to log in" />
      </AuthShell>
    );
  }

  return (
    <AuthShell Icon={Sparkles} title="Signing you in…">
      <ActivityIndicator color="#FF6B6B" size="large" />
      <Text style={styles.hint}>This only takes a moment.</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 28,
    height: 56,
  },
  hint: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 14,
    textAlign: "center",
  },
});
