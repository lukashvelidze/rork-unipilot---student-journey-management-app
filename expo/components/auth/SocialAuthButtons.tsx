import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import Svg, { Path } from "react-native-svg";
import { isAppleSignInAvailable } from "@/lib/auth";

type Provider = "apple" | "google";

type Props = {
  /** "Sign up" on registration, "Sign in" on log in. */
  mode: "signin" | "signup";
  busy: Provider | null;
  disabled?: boolean;
  onPress: (provider: Provider) => void;
};

/** Apple (native button, per Apple's guidelines) and Google sign-in, plus the "or" divider. */
export default function SocialAuthButtons({ mode, busy, disabled, onPress }: Props) {
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  return (
    <View>
      <View style={styles.buttons}>
        {appleAvailable ? (
          <View pointerEvents={disabled || busy ? "none" : "auto"} style={busy === "apple" && styles.busy}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              buttonType={
                mode === "signup"
                  ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                  : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              cornerRadius={27}
              onPress={() => onPress("apple")}
              style={styles.appleButton}
            />
          </View>
        ) : null}

        <TouchableOpacity
          accessibilityLabel={`${mode === "signup" ? "Sign up" : "Sign in"} with Google`}
          accessibilityRole="button"
          activeOpacity={0.8}
          disabled={disabled || !!busy}
          onPress={() => onPress("google")}
          style={[styles.googleButton, (disabled || (busy && busy !== "google")) && styles.dimmed]}
        >
          {busy === "google" ? (
            <ActivityIndicator color="#1F1F1F" />
          ) : (
            <>
              <GoogleLogo />
              <Text style={styles.googleText}>{mode === "signup" ? "Sign up with Google" : "Sign in with Google"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or use your email</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

function GoogleLogo() {
  return (
    <Svg height={19} viewBox="0 0 48 48" width={19}>
      <Path
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
        fill="#FFC107"
      />
      <Path
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        fill="#FF3D00"
      />
      <Path
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
        fill="#4CAF50"
      />
      <Path
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
        fill="#1976D2"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  buttons: {
    gap: 12,
  },
  appleButton: {
    height: 54,
    width: "100%",
  },
  busy: {
    opacity: 0.6,
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DADCE0",
    borderRadius: 27,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 10,
    height: 54,
    justifyContent: "center",
  },
  dimmed: {
    opacity: 0.6,
  },
  googleText: {
    color: "#1F1F1F",
    fontSize: 17,
    fontWeight: "600",
  },
  divider: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginVertical: 22,
  },
  dividerLine: {
    backgroundColor: "#E5E7EB",
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500",
  },
});
