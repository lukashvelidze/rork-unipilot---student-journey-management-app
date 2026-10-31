import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Auth flows for the sign-in and registration screens: Apple, Google, email
 * with verification, and password recovery. Every successful path ends with
 * `ensureProfile`, so `/onboarding` can resume the student where they left off.
 */

/** Deep link that email links and OAuth redirect back to (app/auth/callback). */
export const AUTH_REDIRECT = "unipilot://auth/callback";

WebBrowser.maybeCompleteAuthSession();

// --------------------------------------------------------------------------
// profiles
// --------------------------------------------------------------------------

const displayName = (user: User, fallback?: string | null) =>
  fallback?.trim() ||
  (user.user_metadata?.full_name as string | undefined) ||
  (user.user_metadata?.name as string | undefined) ||
  [user.user_metadata?.given_name, user.user_metadata?.family_name].filter(Boolean).join(" ") ||
  "";

/**
 * Make sure the signed-in user has a profiles row (social and verified sign-ups
 * arrive here without one). Never overwrites an existing profile.
 */
export const ensureProfile = async (user: User, name?: string | null) => {
  const { data: existing } = await supabase.from("profiles").select("id, full_name").eq("id", user.id).maybeSingle();
  if (existing) {
    if (!existing.full_name && displayName(user, name)) {
      await supabase.from("profiles").update({ full_name: displayName(user, name) }).eq("id", user.id);
    }
    return;
  }
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email ?? null, full_name: displayName(user, name) || null },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error) throw error;
};

// --------------------------------------------------------------------------
// friendly errors
// --------------------------------------------------------------------------

export class AuthFlowError extends Error {
  constructor(
    message: string,
    public code: "cancelled" | "unconfirmed" | "provider_disabled" | "other" = "other",
  ) {
    super(message);
  }
}

export const friendlyAuthError = (error: unknown): string => {
  const message = (error as { message?: string })?.message ?? String(error ?? "");
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again or reset your password.";
  if (/email not confirmed/i.test(message)) return "Please verify your email first. We can send a new code.";
  if (/user already registered|already been registered/i.test(message)) return "An account with this email already exists. Log in instead.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  if (/token has expired|otp.*expired|invalid.*otp|token.*invalid/i.test(message)) return "That code is invalid or has expired. Request a new one.";
  if (/weak|pwned|leaked/i.test(message)) return "This password is too easy to guess or has appeared in a data breach. Choose another.";
  if (/provider is not enabled|unsupported provider/i.test(message)) return "This sign-in option isn't available yet. Please use email for now.";
  if (/network|fetch/i.test(message)) return "No connection. Check your internet and try again.";
  return message || "Something went wrong. Please try again.";
};

// --------------------------------------------------------------------------
// Apple
// --------------------------------------------------------------------------

export const isAppleSignInAvailable = async () =>
  Platform.OS === "ios" && (await AppleAuthentication.isAvailableAsync().catch(() => false));

export const signInWithApple = async (): Promise<Session> => {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if ((error as { code?: string })?.code === "ERR_REQUEST_CANCELED") throw new AuthFlowError("cancelled", "cancelled");
    throw error;
  }
  if (!credential.identityToken) throw new AuthFlowError("Apple didn't return a sign-in token. Please try again.");

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error || !data.session) throw error ?? new AuthFlowError("Apple sign-in failed.");

  // Apple only shares the name on the very first sign-in.
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" ");
  if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } }).catch(() => null);
  await ensureProfile(data.session.user, fullName);
  return data.session;
};

// --------------------------------------------------------------------------
// Google (Supabase OAuth in an in-app browser session)
// --------------------------------------------------------------------------

/** Read tokens or a PKCE code from a redirect URL and turn them into a session. */
export const sessionFromRedirect = async (url: string): Promise<Session | null> => {
  const [, query = ""] = url.split("?");
  const [queryPart, hashFromQuery = ""] = query.split("#");
  const hash = url.includes("#") ? url.split("#")[1] : hashFromQuery;
  const params = new URLSearchParams(queryPart);
  new URLSearchParams(hash).forEach((value, key) => params.set(key, value));

  const errorDescription = params.get("error_description") || params.get("error");
  if (errorDescription) throw new AuthFlowError(errorDescription.replace(/\+/g, " "));

  const code = params.get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return data.session;
  }
  return null;
};

export const redirectType = (url: string) => {
  const match = url.match(/[?#&]type=([a-z_]+)/i);
  return match?.[1] ?? null;
};

export const signInWithGoogle = async (): Promise<Session> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: AUTH_REDIRECT,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data?.url) throw error ?? new AuthFlowError("Couldn't start Google sign-in.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_REDIRECT);
  if (result.type !== "success") throw new AuthFlowError("cancelled", "cancelled");

  const session = await sessionFromRedirect(result.url);
  if (!session) throw new AuthFlowError("Google sign-in didn't complete. Please try again.");
  await ensureProfile(session.user);
  return session;
};

// --------------------------------------------------------------------------
// email + password
// --------------------------------------------------------------------------

/**
 * Create an email account. Resolves to the session when the project
 * auto-confirms, or null when the student must verify their email first.
 */
export const signUpWithEmail = async (input: { name: string; email: string; password: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { emailRedirectTo: AUTH_REDIRECT, data: { full_name: input.name } },
  });
  if (error) throw error;
  // An existing, confirmed address comes back with no identities.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new AuthFlowError("An account with this email already exists. Log in instead.");
  }
  if (data.session) await ensureProfile(data.session.user, input.name);
  return data.session;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/email not confirmed/i.test(error.message)) throw new AuthFlowError(friendlyAuthError(error), "unconfirmed");
    throw error;
  }
  await ensureProfile(data.user);
  return data.session;
};

/** Confirm a sign-up with the 6-digit code from the verification email. */
export const verifyEmailCode = async (email: string, code: string) => {
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.session) throw error ?? new AuthFlowError("That code didn't work.");
  await ensureProfile(data.session.user);
  return data.session;
};

export const resendVerification = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: AUTH_REDIRECT },
  });
  if (error) throw error;
};

export const sendPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: AUTH_REDIRECT });
  if (error) throw error;
};

// --------------------------------------------------------------------------
// password strength
// --------------------------------------------------------------------------

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
  "11111111", "iloveyou", "abc12345", "letmein1", "welcome1", "admin123", "unipilot", "football1", "monkey123",
]);

export type PasswordCheck = { id: string; label: string; met: boolean };

export const passwordChecks = (password: string, email?: string): PasswordCheck[] => {
  const local = email?.split("@")[0]?.toLowerCase() ?? "";
  return [
    { id: "length", label: "At least 8 characters", met: password.length >= 8 },
    { id: "case", label: "Upper and lowercase letters", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: "number", label: "A number", met: /\d/.test(password) },
    { id: "symbol", label: "A symbol (like ! ? # @)", met: /[^A-Za-z0-9]/.test(password) },
    {
      id: "common",
      label: "Not a common password or your email",
      met:
        password.length > 0 &&
        !COMMON_PASSWORDS.has(password.toLowerCase()) &&
        !(local.length >= 3 && password.toLowerCase().includes(local)),
    },
  ];
};

/** 0–4 score; 3+ is required to create an account. */
export const passwordScore = (password: string, email?: string) => {
  const checks = passwordChecks(password, email);
  const byId = Object.fromEntries(checks.map((c) => [c.id, c.met]));
  if (!byId.length || !byId.common) return Math.min(1, password.length ? 1 : 0);
  return ["case", "number", "symbol"].filter((id) => byId[id]).length + 1;
};

export const PASSWORD_MIN_SCORE = 3;
