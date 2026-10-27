import { ElevenLabsProvider, useConversation } from "@elevenlabs/react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { ArrowLeft, CircleAlert, Crown, GraduationCap, Mic, Sparkles, Star } from "lucide-react-native";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import {
  fetchInterviewUsage,
  finishInterviewSession,
  InterviewFeedback,
  InterviewUsage,
  startInterviewSession,
  TranscriptTurn,
} from "@/lib/interview";
import { openManageSubscription } from "@/lib/subscriptionManager";
import { posthog } from "@/src/config/posthog";

const AGENT_ID = "agent_7401k7a0wx3mfy2tmm361gsbh61a";

type Phase = "idle" | "connecting" | "live" | "scoring";

/**
 * Screen state. ElevenLabsProvider remounts its children whenever the voice
 * connection starts or ends (it keys the room by conversation id), so this
 * lives above the provider and is passed down.
 */
function useSimulatorState() {
  const [usage, setUsage] = useState<InterviewUsage | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<TranscriptTurn[]>([]);
  const finishingRef = useRef(false);

  useEffect(() => {
    fetchInterviewUsage().then(setUsage);
  }, []);

  return {
    usage, setUsage, phase, setPhase, feedback, setFeedback, notice, setNotice,
    sessionIdRef, transcriptRef, finishingRef,
  };
}

type SimulatorState = ReturnType<typeof useSimulatorState>;

function InterviewSimulator({ state }: { state: SimulatorState }) {
  const router = useRouter();
  const handleBack = useAppBack("/(tabs)/premium");
  const {
    usage, setUsage, phase, setPhase, feedback, setFeedback, notice, setNotice,
    sessionIdRef, transcriptRef, finishingRef,
  } = state;

  const finish = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || finishingRef.current) return;
    finishingRef.current = true;
    setPhase("scoring");
    try {
      const result = await finishInterviewSession(sessionId, transcriptRef.current);
      setUsage(result.usage);
      if (result.scored && result.feedback) {
        setFeedback(result.feedback);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
        posthog.capture("interview_session_scored", { score: result.feedback.score });
      } else if (result.reason) {
        setNotice(result.reason);
      }
    } catch (error) {
      console.error("Could not finish interview:", error);
      setNotice("We couldn't save this session. Please check your connection.");
    } finally {
      sessionIdRef.current = null;
      transcriptRef.current = [];
      finishingRef.current = false;
      setPhase("idle");
    }
  }, [finishingRef, sessionIdRef, setFeedback, setNotice, setPhase, setUsage, transcriptRef]);

  const conversation = useConversation({
    onConnect: () => setPhase("live"),
    onDisconnect: () => {
      if (sessionIdRef.current) finish();
      else setPhase("idle");
    },
    onMessage: ({ message, role }: { message: string; role?: string }) => {
      if (!message?.trim()) return;
      transcriptRef.current.push({ role: role === "user" ? "user" : "agent", text: message });
    },
    onError: (error: unknown) => {
      console.error("Conversation error:", error);
    },
  });

  const limitReached = !!usage && !usage.unlimited && (usage.remaining ?? 0) <= 0;

  const start = async () => {
    if (phase !== "idle") return;
    setNotice(null);
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Microphone needed", "Allow microphone access in Settings to practise your interview.");
      return;
    }

    setPhase("connecting");
    try {
      const session = await startInterviewSession();
      sessionIdRef.current = session.sessionId;
      transcriptRef.current = [];
      setUsage(session.usage);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
      await conversation.startSession({ agentId: AGENT_ID });
      posthog.capture("interview_session_started");
    } catch (error) {
      const limit = (error as { limitReached?: boolean })?.limitReached;
      if (limit) {
        const nextUsage = (error as { usage?: InterviewUsage }).usage;
        if (nextUsage) setUsage(nextUsage);
      } else {
        console.error("Failed to start interview:", error);
        setNotice("We couldn't start the interview. Please try again.");
      }
      if (sessionIdRef.current) await finish();
      setPhase("idle");
    }
  };

  const stop = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
    // onDisconnect normally finishes the session; cover the case where it doesn't fire.
    if (sessionIdRef.current) finish();
  };

  const live = phase === "live";
  const sessionNumber = usage && usage.limit ? Math.min(usage.used + (live ? 0 : 1), usage.limit) : null;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          disabled={live || phase === "scoring"}
          hitSlop={10}
          onPress={handleBack}
          style={styles.back}
        >
          <ArrowLeft color={UI.text} size={22} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <GraduationCap color={UI.primary} size={46} strokeWidth={1.6} />
        <Text accessibilityRole="header" style={styles.title}>
          Interview simulator
        </Text>
        <Text style={styles.subtitle}>Practice visa and university interviews with AI</Text>
      </View>

      <View style={styles.stage}>
        <View style={styles.sessionPill}>
          {usage?.unlimited ? (
            <Crown color={UI.primary} size={12} strokeWidth={2.4} />
          ) : (
            <Sparkles color={UI.primary} size={12} strokeWidth={2.4} />
          )}
          <Text style={styles.sessionPillText}>
            {!usage
              ? "Loading sessions…"
              : usage.unlimited
                ? "Unlimited sessions"
                : limitReached
                  ? `All ${usage.limit} free sessions used`
                  : `Free Session: ${sessionNumber} of ${usage.limit}`}
          </Text>
        </View>

        <MicOrb active={live} speaking={conversation.isSpeaking} />

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, live ? styles.statusDotLive : styles.statusDotIdle]} />
          <Text style={[styles.statusText, live && styles.statusTextLive]}>
            {phase === "connecting"
              ? "CONNECTING…"
              : phase === "scoring"
                ? "SCORING YOUR ANSWERS…"
                : live
                  ? conversation.isSpeaking
                    ? "INTERVIEWER SPEAKING"
                    : "LISTENING…"
                  : "DISCONNECTED"}
          </Text>
        </View>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.footer}>
        {limitReached && !live ? (
          <>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={() => openManageSubscription().catch(() => router.push("/premium" as any))}
              style={styles.primary}
            >
              <Text style={styles.primaryText}>Upgrade for unlimited practice</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Premium includes unlimited interview sessions</Text>
          </>
        ) : (
          <>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              disabled={phase === "connecting" || phase === "scoring" || !usage}
              onPress={live ? stop : start}
              style={[styles.primary, live && styles.primaryLive, (phase === "connecting" || phase === "scoring") && styles.primaryBusy]}
            >
              {phase === "connecting" || phase === "scoring" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>{live ? "Stop conversation" : "Start conversation"}</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>
              {live ? "Answer as you would in the real interview" : "Ensure your mic is on"}
            </Text>
          </>
        )}
      </View>

      <FeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />
    </SafeAreaView>
  );
}

function MicOrb({ active, speaking }: { active: boolean; speaking: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: speaking ? 900 : 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse, speaking]);

  const ring = (delay: number) => ({
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55 - delay, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55 + delay] }) }],
  });

  return (
    <View style={styles.orbWrap}>
      {active ? (
        <>
          <Animated.View style={[styles.orbRing, ring(0)]} />
          <Animated.View style={[styles.orbRing, ring(0.2)]} />
        </>
      ) : null}
      <View style={[styles.orbHalo, active ? styles.orbHaloLive : styles.orbHaloIdle]}>
        <View style={[styles.orb, active ? styles.orbLive : styles.orbIdle]}>
          <Mic color={active ? "#FFFFFF" : UI.primary} size={26} strokeWidth={2} />
        </View>
      </View>
    </View>
  );
}

function FeedbackModal({ feedback, onClose }: { feedback: InterviewFeedback | null; onClose: () => void }) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={!!feedback}>
      <View style={styles.modalBackdrop}>
        {feedback ? (
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Feedback</Text>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>Score: {feedback.score}/10</Text>
              </View>
            </View>
            <View style={styles.modalDivider} />

            <View style={styles.feedbackHeading}>
              <Star color={UI.success} size={15} strokeWidth={2.2} />
              <Text style={[styles.feedbackLabel, { color: UI.success }]}>KEY STRENGTHS</Text>
            </View>
            <Text style={styles.feedbackText}>{feedback.strengths}</Text>

            <View style={[styles.feedbackHeading, styles.feedbackHeadingSpaced]}>
              <CircleAlert color={UI.primary} size={15} strokeWidth={2.2} />
              <Text style={[styles.feedbackLabel, { color: UI.primary }]}>REQUIRES IMPROVEMENTS</Text>
            </View>
            <Text style={styles.feedbackText}>{feedback.improvements}</Text>

            <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={onClose} style={styles.modalButton}>
              <Text style={styles.primaryText}>Continue</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export default function InterviewSimulatorScreen() {
  const state = useSimulatorState();
  return (
    <ElevenLabsProvider>
      <InterviewSimulator state={state} />
    </ElevenLabsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  topBar: {
    paddingHorizontal: GUTTER - 10,
    paddingTop: 4,
  },
  back: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingTop: 8,
  },
  title: {
    color: UI.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 12,
  },
  subtitle: {
    color: UI.textSecondary,
    fontSize: 13.5,
    marginTop: 6,
    textAlign: "center",
  },
  stage: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: 26,
    borderWidth: 1,
    marginHorizontal: GUTTER,
    marginTop: 26,
    paddingBottom: 30,
    paddingTop: 18,
  },
  sessionPill: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sessionPillText: {
    color: UI.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  orbWrap: {
    alignItems: "center",
    height: 170,
    justifyContent: "center",
    width: 170,
  },
  orbRing: {
    backgroundColor: "#FFC9C9",
    borderRadius: 60,
    height: 120,
    position: "absolute",
    width: 120,
  },
  orbHalo: {
    alignItems: "center",
    borderRadius: 60,
    height: 120,
    justifyContent: "center",
    width: 120,
  },
  orbHaloLive: {
    backgroundColor: "#FFE1E1",
  },
  orbHaloIdle: {
    backgroundColor: "#F2F2F6",
  },
  orb: {
    alignItems: "center",
    borderRadius: 40,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  orbLive: {
    backgroundColor: UI.primary,
    shadowColor: UI.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  orbIdle: {
    backgroundColor: UI.card,
    ...CARD_SHADOW,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  statusDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusDotLive: {
    backgroundColor: UI.primary,
  },
  statusDotIdle: {
    backgroundColor: "#A6A6B5",
  },
  statusText: {
    color: UI.textSecondary,
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  statusTextLive: {
    color: UI.primary,
  },
  notice: {
    color: UI.textSecondary,
    fontSize: 13.5,
    lineHeight: 19,
    marginHorizontal: GUTTER,
    marginTop: 16,
    textAlign: "center",
  },
  footer: {
    marginTop: "auto",
    paddingBottom: 12,
    paddingHorizontal: GUTTER,
  },
  primary: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    shadowColor: UI.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  primaryLive: {
    backgroundColor: "#FF9A9A",
    shadowOpacity: 0,
  },
  primaryBusy: {
    opacity: 0.8,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 10,
    textAlign: "center",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(247,247,250,0.82)",
    flex: 1,
    justifyContent: "center",
    padding: GUTTER,
  },
  modalCard: {
    alignSelf: "stretch",
    backgroundColor: UI.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#1C1C2E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: UI.text,
    fontSize: 18,
    fontWeight: "800",
  },
  scorePill: {
    backgroundColor: UI.successSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: {
    color: UI.success,
    fontSize: 12.5,
    fontWeight: "800",
  },
  modalDivider: {
    backgroundColor: UI.hairline,
    height: 1,
    marginVertical: 14,
  },
  feedbackHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  feedbackHeadingSpaced: {
    marginTop: 16,
  },
  feedbackLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  feedbackText: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  modalButton: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    marginTop: 22,
  },
});
