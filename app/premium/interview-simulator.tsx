import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import {
 StyleSheet,
 View,
 Text,
 TouchableOpacity,
 Alert,
 ActivityIndicator,
 Platform,
 PermissionsAndroid,
 Linking,
 ScrollView,
} from "react-native";
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter, useNavigation } from "expo-router";
import { Mic, MicOff, PhoneOff, Volume2, AlertCircle, Lock, Crown, ArrowRight, ChevronLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Easing } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAppBack } from "@/hooks/useAppBack";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { useAppStateStore } from "@/store/appStateStore";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";

// Conditionally import ElevenLabs hooks - they require native modules
let useConversation: any = null;
let isElevenLabsAvailable = false;
try {
 const elevenLabsModule = require("@elevenlabs/react-native");
 useConversation = elevenLabsModule.useConversation;
 isElevenLabsAvailable = true;
} catch (error) {
 console.log("ElevenLabs SDK not available");
}

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === "storeClient";

// Separate component for the actual interview functionality
// This ensures hooks are called consistently
function InterviewContent() {
 const Colors = useColors();
 const navigation = useNavigation();
 const handleBack = useAppBack("/premium");
 const { user } = useUserStore();
 const scrollViewRef = useRef<ScrollView>(null);
 const isMountedRef = useRef(true);

 const [isMuted, setIsMuted] = useState(false);
 const [hasPermission, setHasPermission] = useState(false);
 const [isRequestingPermission, setIsRequestingPermission] = useState(false);
 const [messages, setMessages] = useState<Array<{ id: string; text: string; type: "user" | "agent" | "system" }>>([]);
 const [connectionError, setConnectionError] = useState<string | null>(null);
 const [hasEverConnected, setHasEverConnected] = useState(false);
 const connectStartedAtRef = useRef<number | null>(null);
 const pulseAnim = useRef(new Animated.Value(1)).current;

 // Get agent ID from environment variable or use placeholder
 const AGENT_ID = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID || "agent_7401k7a0wx3mfy2tmm361gsbh61a";

 // Configure audio session for playback
 const configureAudio = useCallback(async () => {
 try {
 await Audio.setAudioModeAsync({
 allowsRecordingIOS: true,
 playsInSilentModeIOS: true,
 staysActiveInBackground: false,
 shouldDuckAndroid: true,
 playThroughEarpieceAndroid: false,
 });
 console.log("Audio configured successfully");
 } catch (error) {
 console.error("Failed to configure audio:", error);
 }
 }, []);

 // Scroll to bottom when new messages arrive
 const scrollToBottom = useCallback(() => {
 setTimeout(() => {
 scrollViewRef.current?.scrollToEnd({ animated: true });
 }, 100);
 }, []);

 const addMessage = useCallback((type: "user" | "agent" | "system", text: string) => {
 if (!isMountedRef.current) return;
 setMessages((prev) => [
 ...prev,
 {
 id: Date.now().toString() + Math.random().toString(),
 text,
 type,
 },
 ]);
 scrollToBottom();
 }, [scrollToBottom]);

 // Initialize conversation hook with callbacks - MUST be called unconditionally
 // Wrap all callbacks in try-catch to prevent uncaught errors from crashing the app
 const conversation = useConversation({
 onConnect: () => {
 try {
 if (!isMountedRef.current) return;
 console.log("Connected to conversation");
 setConnectionError(null);
 setHasEverConnected(true);
 addMessage("system", "Connected! The interviewer is ready. Start speaking when you're ready.");
 } catch (e) {
 console.error("Error in onConnect:", e);
 }
 },
 onDisconnect: () => {
 try {
 if (!isMountedRef.current) return;
 console.log("Disconnected from conversation");
 // Only add message if there was no error (normal disconnect)
 if (!connectionError) {
 addMessage("system", "Interview session ended.");
 }
 } catch (e) {
 console.error("Error in onDisconnect:", e);
 }
 },
 onMessage: (message: any) => {
 try {
 if (!isMountedRef.current) return;
 console.log("Message received:", message);
 const messageText = message.text || message.content || message.message || "";
 const messageType = message.type || message.role || "";

 // Treat first agent response as authoritative connection signal
 if (!hasEverConnected && (messageType === "agent" || messageType === "assistant")) {
 setHasEverConnected(true);
 setConnectionError(null);
 }

 if (messageType === "user" || messageType === "user_transcript" || messageType === "user_message") {
 if (messageText) {
 addMessage("user", messageText);
 }
 } else if (messageType === "agent" || messageType === "assistant" || messageType === "agent_response") {
 if (messageText) {
 addMessage("agent", messageText);
 }
 } else if (messageType === "debug" || messageType === "system") {
 console.log("Debug:", messageText);
 } else if (messageText) {
 addMessage("agent", messageText);
 }
 } catch (e) {
 console.error("Error in onMessage:", e);
 }
 },
 onError: (error: any) => {
 try {
 if (!isMountedRef.current) return;
 console.error("Conversation error:", error);
 const errorMessage = error?.message || "Connection lost. Please try again.";
 setConnectionError(errorMessage);
 setHasEverConnected(false);
 connectStartedAtRef.current = null;
 if (conversation?.endSession) {
 conversation.endSession().catch(() => {});
 }
 addMessage("system", `Connection error: ${errorMessage}`);
 // Don't show Alert here as it can cause issues - just update the UI
 } catch (e) {
 console.error("Error in onError handler:", e);
 }
 },
 onModeChange: (mode: any) => {
 try {
 if (!isMountedRef.current) return;
 console.log("Conversation mode changed:", mode);
 } catch (e) {
 console.error("Error in onModeChange:", e);
 }
 },
 onStatusChange: (prop: any) => {
 try {
 if (!isMountedRef.current) return;
 console.log("Conversation status changed:", prop?.status);
 if (prop?.status === "connected") {
 setConnectionError(null);
 }
 } catch (e) {
 console.error("Error in onStatusChange:", e);
 }
 },
 });

 // Derive connection state
 const connectionStatus = conversation?.status;
  const isConnecting =
  !hasEverConnected &&
  !connectionError &&
  (connectionStatus === "connecting" ||
  connectionStatus === "initializing");
 const isConnected =
 hasEverConnected || connectionStatus === "connected";

 // Sync derived connection flag when status reports connected
 useEffect(() => {
 if (connectionStatus === "connected") {
 setHasEverConnected(true);
 setConnectionError(null);
 }
 }, [connectionStatus]);

 const requestMicrophonePermission = async () => {
 setIsRequestingPermission(true);
 try {
 if (Platform.OS === "android") {
 const granted = await PermissionsAndroid.request(
 PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
 {
 title: "Microphone Permission",
 message: "UniPilot needs microphone access to enable voice conversations for interview practice.",
 buttonNeutral: "Ask Me Later",
 buttonNegative: "Cancel",
 buttonPositive: "OK",
 }
 );
 setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
 return granted === PermissionsAndroid.RESULTS.GRANTED;
 } else {
 const { status, canAskAgain } = await Audio.requestPermissionsAsync();

 if (status === 'granted') {
 setHasPermission(true);
 return true;
 } else {
 setHasPermission(false);

 if (!canAskAgain) {
 Alert.alert(
 "Microphone Permission Required",
 "Please enable microphone access in Settings > UniPilot > Microphone to use the Interview Simulator.",
 [
 { text: "Cancel", style: "cancel" },
 { text: "Open Settings", onPress: () => {
 Linking.openURL('app-settings:');
 }}
 ]
 );
 }
 return false;
 }
 }
 } catch (error) {
 console.error("Error requesting microphone permission:", error);
 Alert.alert("Error", "Failed to request microphone permission.");
 setHasPermission(false);
 return false;
 } finally {
 setIsRequestingPermission(false);
 }
 };

 useEffect(() => {
 isMountedRef.current = true;
 // Configure audio on mount
 configureAudio();

 // Check permission status on mount
 const checkPermission = async () => {
 try {
 if (Platform.OS === "android") {
 const granted = await PermissionsAndroid.check(
 PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
 );
 setHasPermission(granted);
 if (!granted) {
 await requestMicrophonePermission();
 }
 } else {
 const { status } = await Audio.getPermissionsAsync();

 if (status === 'granted') {
 setHasPermission(true);
 } else {
 await requestMicrophonePermission();
 }
 }
 } catch (error) {
 console.error("Error checking microphone permission:", error);
 setHasPermission(false);
 }
 };

 checkPermission();

 // Cleanup on unmount
 return () => {
 isMountedRef.current = false;
 if (conversation?.status === "connected") {
 try {
 conversation.endSession();
 } catch (e) {
 console.log("Cleanup: session already ended");
 }
 }
 setHasEverConnected(false);
 connectStartedAtRef.current = null;
 };
 }, []);

 const startConversation = async () => {
 if (!isMountedRef.current) return;
 if (!conversation?.startSession) {
 Alert.alert(
 "Interview not available",
 "Voice interview requires the ElevenLabs SDK. Please update to a development build."
 );
 return;
 }

 // Prevent duplicate starts while connecting/connected
 if (conversation.status === "connecting" || conversation.status === "initializing" || conversation.status === "connected") {
 return;
 }
 setHasEverConnected(false);
 // Clear any previous errors
 setConnectionError(null);

 // Verify permission before starting
 if (!hasPermission) {
 const granted = await requestMicrophonePermission();
 if (!granted) {
 return;
 }
 }

 if (AGENT_ID === "your-agent-id-here") {
 Alert.alert(
 "Configuration Required",
 "Please configure your ElevenLabs agent ID in the environment variables (EXPO_PUBLIC_ELEVENLABS_AGENT_ID)."
 );
 return;
 }

 try {
 // Configure audio before starting
 await configureAudio();

 if (!isMountedRef.current) return;
 connectStartedAtRef.current = Date.now();
 setMessages([]);
 addMessage("system", "Connecting to interview simulator...");

 await conversation.startSession({
 agentId: AGENT_ID,
 userId: user?.id || "anonymous",
 });

 // Session started - state will be updated via onConnect/status callbacks
 } catch (error: any) {
 console.error("Failed to start conversation:", error);
 if (!isMountedRef.current) return;
 setConnectionError(error?.message || "Failed to connect");
 addMessage("system", `Failed to start: ${error?.message || "Connection error. Please try again."}`);
 }
 };

 const endConversation = useCallback(async () => {
 try {
 if (conversation?.endSession) {
 await conversation.endSession();
 }
 setHasEverConnected(false);
 } catch (error: any) {
 console.error("Failed to end conversation:", error);
 }
 }, [connectionStatus, hasEverConnected, conversation]);

 useEffect(() => {
 const unsubscribe = navigation.addListener("beforeRemove", (event) => {
 // Allow navigation while connecting; only guard active sessions
 if (conversation?.status !== "connected") return;

 event.preventDefault();
 Alert.alert(
 "Leave Interview?",
 "Please end the interview before leaving this screen.",
 [
 { text: "Stay", style: "cancel" },
 {
 text: "End & Leave",
 style: "destructive",
 onPress: () => {
 endConversation().finally(() => {
 navigation.dispatch(event.data.action);
 });
 },
 },
 ]
 );
 });

 return unsubscribe;
 }, [navigation, conversation, endConversation]);

 const toggleMute = () => {
 const newMutedState = !isMuted;
 setIsMuted(newMutedState);
 if (conversation?.setMicMuted) {
 conversation.setMicMuted(newMutedState);
 }
 };

 // Mic pulse animation
 useEffect(() => {
 if (isConnecting || isConnected) {
 const loop = Animated.loop(
 Animated.sequence([
 Animated.timing(pulseAnim, { toValue: 1.1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
 Animated.timing(pulseAnim, { toValue: 0.95, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
 ])
 );
 loop.start();
 return () => loop.stop();
 } else {
 pulseAnim.setValue(1);
 }
 }, [isConnecting, isConnected, pulseAnim]);

 // Connection timeout while status stays "connecting"
 useEffect(() => {
 const status = connectionStatus;
 if (hasEverConnected) return;
 if (status !== "connecting" && status !== "initializing") return;
 const startedAt = connectStartedAtRef.current;
 if (!startedAt) return;

 const timeout = setTimeout(() => {
 if (!isMountedRef.current) return;
 if (conversation?.endSession) {
 conversation.endSession().catch(() => {});
 }
 setHasEverConnected(false);
 setConnectionError("Connection timed out. Please try again.");
 connectStartedAtRef.current = null;
 }, 8000);

 return () => clearTimeout(timeout);
 }, [conversation]);

 const sendFeedback = async (liked: boolean) => {
 try {
 if (conversation?.sendFeedback) {
 await conversation.sendFeedback(liked);
 Alert.alert("Thank you!", "Your feedback helps us improve the interview simulator.");
 }
 } catch (error) {
 console.error("Failed to send feedback:", error);
 }
 };

 return (
 <View style={[styles.container, { backgroundColor: Colors.background }]}>
 <Stack.Screen
 options={{
 title: "Interview Simulator",
 headerShown: true,
 }}
 />

 <ScrollView
 style={styles.scrollContainer}
 contentContainerStyle={styles.content}
 showsVerticalScrollIndicator={false}
 >
 {/* Header Section */}
 <View style={styles.header}>
 <TouchableOpacity
 onPress={handleBack}
 style={[styles.inlineBackButton, { backgroundColor: Colors.lightBackground }]}
 activeOpacity={0.8}
 >
 <ChevronLeft size={20} color={Colors.text} />
 </TouchableOpacity>
 <View style={[styles.iconContainer, { backgroundColor: Colors.primary + "20" }]}>
 <Mic size={32} color={Colors.primary} />
 </View>
 <Text style={[styles.title, { color: Colors.text }]}>Interview Simulator</Text>
 <Text style={[styles.subtitle, { color: Colors.lightText }]}>
 Practice visa and university interviews with AI
 </Text>
 </View>

 {/* Mic Control */}
 <View style={styles.micSection}>
 <Animated.View style={[styles.pulseWrapper, { transform: [{ scale: pulseAnim }] }]}>
 <LinearGradient
 colors={isConnected ? [Colors.primary, Colors.secondary || Colors.primary] : [Colors.primary, Colors.primaryDark || Colors.primary]}
 start={{ x: 0, y: 0 }}
 end={{ x: 1, y: 1 }}
 style={styles.micButton}
 >
 <TouchableOpacity
 activeOpacity={0.9}
 onPress={isConnected ? endConversation : startConversation}
 style={styles.micTouchable}
 >
 <Mic size={34} color="#FFFFFF" />
 </TouchableOpacity>
 </LinearGradient>
 </Animated.View>
 <Text style={[styles.micStatus, { color: Colors.text }]}>
 {connectionError
 ? connectionError
 : isConnected
 ? "Live - speak naturally"
 : isConnecting
 ? "Connecting..."
 : "Tap to start interview"}
 </Text>
 <Text style={[styles.micHint, { color: Colors.lightText }]}>
 {isConnected ? "You can mute or end anytime." : "We’ll start listening right after you tap."}
 </Text>
 </View>

 {/* Messages Area */}
 <Card style={[styles.messagesCard, { backgroundColor: Colors.card }]}>
 <Text style={[styles.messagesTitle, { color: Colors.text }]}>Conversation</Text>
 <ScrollView
 ref={scrollViewRef}
 style={styles.messagesScrollView}
 contentContainerStyle={styles.messagesContainer}
 showsVerticalScrollIndicator={true}
 nestedScrollEnabled={true}
 onContentSizeChange={() => scrollToBottom()}
 >
 {messages.length === 0 ? (
 <View style={styles.emptyMessages}>
 <Text style={[styles.emptyText, { color: Colors.lightText }]}>
 {isConnected
 ? "Start speaking to begin the interview..."
 : "Tap 'Start Interview' to begin"}
 </Text>
 </View>
 ) : (
 messages.map((message) => (
 <View
 key={message.id}
 style={[
 styles.messageBubble,
 message.type === "user" && styles.userMessage,
 message.type === "agent" && styles.agentMessage,
 message.type === "system" && styles.systemMessage,
 message.type === "user" && { backgroundColor: Colors.primary + "20" },
 message.type === "agent" && { backgroundColor: Colors.lightBackground || Colors.card, borderWidth: 1, borderColor: Colors.border },
 message.type === "system" && { backgroundColor: Colors.lightText + "15" },
 ]}
 >
 {message.type !== "system" && (
 <Text style={[styles.messageLabel, { color: Colors.lightText }]}>
 {message.type === "user" ? "You" : "Interviewer"}
 </Text>
 )}
 <Text
 style={[
 styles.messageText,
 { color: message.type === "system" ? Colors.lightText : Colors.text },
 message.type === "system" && styles.systemMessageText,
 ]}
 >
 {message.text}
 </Text>
 </View>
 ))
 )}
 </ScrollView>
 </Card>

 {/* Error Banner */}
 {connectionError && !isConnected && (
 <Card style={[styles.errorBanner, { backgroundColor: (Colors.error || "#FF3B30") + "15", borderColor: Colors.error || "#FF3B30" }]}>
 <View style={styles.errorBannerContent}>
 <AlertCircle size={20} color={Colors.error || "#FF3B30"} />
 <Text style={[styles.errorBannerText, { color: Colors.error || "#FF3B30" }]}>
 {connectionError}
 </Text>
 </View>
 </Card>
 )}

 {/* Controls */}
 <View style={styles.controls}>
 <TouchableOpacity
 style={[styles.secondaryButton, { backgroundColor: Colors.card, borderColor: Colors.primary }]}
 onPress={toggleMute}
 >
 {isMuted ? (
 <>
 <MicOff size={20} color={Colors.primary} />
 <Text style={[styles.secondaryButtonText, { color: Colors.primary }]}>Unmute</Text>
 </>
 ) : (
 <>
 <Mic size={20} color={Colors.primary} />
 <Text style={[styles.secondaryButtonText, { color: Colors.primary }]}>Mute</Text>
 </>
 )}
 </TouchableOpacity>
 <TouchableOpacity
 style={[styles.dangerButton, { backgroundColor: Colors.error || "#FF3B30" }]}
 onPress={endConversation}
 disabled={!isConnected && !isConnecting}
 >
 <PhoneOff size={20} color="#FFFFFF" />
 <Text style={styles.dangerButtonText}>{isConnected ? "End" : "Cancel"}</Text>
 </TouchableOpacity>
 </View>

 {/* Feedback Section */}
 {conversation?.canSendFeedback && isConnected && (
 <Card style={[styles.feedbackCard, { backgroundColor: Colors.card }]}>
 <Text style={[styles.feedbackTitle, { color: Colors.text }]}>How was your experience?</Text>
 <View style={styles.feedbackButtons}>
 <TouchableOpacity
 style={[styles.feedbackButton, { backgroundColor: Colors.success + "20" }]}
 onPress={() => sendFeedback(true)}
 >
 <Text style={[styles.feedbackButtonText, { color: Colors.success }]}>Good</Text>
 </TouchableOpacity>
 <TouchableOpacity
 style={[styles.feedbackButton, { backgroundColor: (Colors.error || "#FF3B30") + "20" }]}
 onPress={() => sendFeedback(false)}
 >
 <Text style={[styles.feedbackButtonText, { color: Colors.error || "#FF3B30" }]}>Needs Work</Text>
 </TouchableOpacity>
 </View>
 </Card>
 )}
 </ScrollView>
 </View>
 );
}

// Main screen component that handles access control
export default function InterviewSimulatorScreen() {
 const Colors = useColors();
 const insets = useSafeAreaInsets();
 const router = useRouter();
 const handleBack = useAppBack("/premium");
 const { setInCriticalFlow } = useAppStateStore();

 const [isCheckingAccess, setIsCheckingAccess] = useState(true);
 const [hasProAccess, setHasProAccess] = useState(false);
 const [accessError, setAccessError] = useState<string | null>(null);
 const isMountedRef = useRef(true);
 const isCheckingRef = useRef(true);
 const accessCheckStartedAtRef = useRef<number | null>(null);
 const timeoutTriggeredRef = useRef(false);

 // Critical flow guard: run synchronously before paint
 useLayoutEffect(() => {
 setInCriticalFlow(true);
 return () => setInCriticalFlow(false);
 }, [setInCriticalFlow]);

 // Cleanup mounted flag on unmount
 useEffect(() => {
 return () => {
 isMountedRef.current = false;
 };
 }, []);

 const resolveAccess = useCallback((allowed: boolean, error: string | null = null) => {
 if (!isMountedRef.current) return;
 console.log("[InterviewSimulator] Access resolved:", allowed ? "allowed" : "denied", error ? `(${error})` : "");
 setHasProAccess(allowed);
 setAccessError(error);
 setIsCheckingAccess(false);
 isCheckingRef.current = false;
 }, []);

 const runAccessCheck = useCallback(async () => {
 timeoutTriggeredRef.current = false;
 isCheckingRef.current = true;
 setIsCheckingAccess(true);
 setAccessError(null);
 accessCheckStartedAtRef.current = Date.now();
 console.log("[InterviewSimulator] Access check started");

 try {
 const { data: { user: authUser } } = await supabase.auth.getUser();
 if (!authUser) {
 resolveAccess(false, null);
 return;
 }

 const { data: profile, error: profileError } = await supabase
 .from("profiles")
 .select("subscription_tier")
 .eq("id", authUser.id)
 .single();

 if (profileError) {
 console.error("Error checking pro access:", profileError);
 resolveAccess(false, "Unable to verify access. Please retry.");
 return;
 }

   const tier = profile?.subscription_tier;
   const isPremiumTier = tier === "premium";
   resolveAccess(!!isPremiumTier, null);
 } catch (error) {
 console.error("Error checking pro access:", error);
 resolveAccess(false, "Unable to verify access. Please retry.");
 }
 }, [resolveAccess]);

 // Check if user has Pro tier access once on mount
 useEffect(() => {
 runAccessCheck();

 // Failsafe: stop loading if access check hangs (single, non-resetting)
 const failsafeInterval = setInterval(() => {
 if (timeoutTriggeredRef.current) return;
 const startedAt = accessCheckStartedAtRef.current;
 if (!startedAt) return;
 const now = Date.now();
 if (now - startedAt > 6000 && isCheckingRef.current) {
 timeoutTriggeredRef.current = true;
 console.log("[InterviewSimulator] Access check timeout fallback");
 resolveAccess(false, "Timed out while checking access. Please retry.");
 }
 }, 500);

 return () => {
 clearInterval(failsafeInterval);
 };
 }, [resolveAccess, runAccessCheck]);

 // Show loading while checking access
 if (isCheckingAccess) {
 return (
 <View style={[styles.container, { backgroundColor: Colors.background, paddingTop: insets.top }]}>
 <Stack.Screen
 options={{
 title: "Interview Simulator",
 headerShown: true,
 }}
 />
 <View style={styles.loadingContainer}>
 <ActivityIndicator size="large" color={Colors.primary} />
 <Text style={[styles.loadingText, { color: Colors.lightText }]}>
 Checking access...
 </Text>
 </View>
 </View>
 );
 }

 // Show upgrade/error prompt if user doesn't have Pro access
 if (!hasProAccess) {
 return (
 <View style={[styles.container, { backgroundColor: Colors.background, paddingTop: insets.top }]}>
 <Stack.Screen
 options={{
 title: "Interview Simulator",
 headerShown: true,
 }}
 />
 <View style={styles.lockedContainer}>
 <View style={[styles.lockedIconContainer, { backgroundColor: Colors.primary + "20" }]}>
 <Lock size={48} color={Colors.primary} />
 </View>
 <Text style={[styles.lockedTitle, { color: Colors.text }]}>
 Pro Feature
 </Text>
 <Text style={[styles.lockedDescription, { color: Colors.lightText }]}>
 The Interview Simulator is an exclusive Pro plan feature. Practice visa and university interviews with AI-powered voice conversations.
 </Text>
 {accessError ? (
 <Text style={[styles.lockedDescription, { color: Colors.error || Colors.primary }]}>
 {accessError}
 </Text>
 ) : null}

 <Card style={[styles.featureCard, { backgroundColor: Colors.card }]} variant="elevated">
 <View style={styles.featureRow}>
 <Crown size={24} color={Colors.primary} />
 <View style={styles.featureTextContainer}>
 <Text style={[styles.featureTitle, { color: Colors.text }]}>What's Included</Text>
 <Text style={[styles.featureText, { color: Colors.lightText }]}>
 • AI-powered interview practice{'\n'}
 • Real-time voice conversations{'\n'}
 • Visa interview preparation{'\n'}
 • University admission practice
 </Text>
 </View>
 </View>
 </Card>

 <Button
 title={accessError ? "Retry Access Check" : "Upgrade to Pro"}
 onPress={() => {
 if (accessError) {
 runAccessCheck();
 } else {
 router.push("/premium");
 }
 }}
 icon={<ArrowRight size={20} color="#FFFFFF" />}
 fullWidth
 style={styles.upgradeButton}
 />

 <TouchableOpacity onPress={handleBack} style={styles.backLink}>
 <Text style={[styles.backLinkText, { color: Colors.primary }]}>
 Go Back
 </Text>
 </TouchableOpacity>
 </View>
 </View>
 );
 }

 // Show error if ElevenLabs is not available (Expo Go)
 if (!isElevenLabsAvailable || isExpoGo) {
 return (
 <View style={[styles.container, { backgroundColor: Colors.background, paddingTop: insets.top }]}>
 <Stack.Screen
 options={{
 title: "Interview Simulator",
 headerShown: true,
 }}
 />
 <View style={styles.errorContainer}>
 <View style={[styles.errorIconContainer, { backgroundColor: (Colors.error || "#FF3B30") + "20" }]}>
 <AlertCircle size={48} color={Colors.error || "#FF3B30"} />
 </View>
 <Text style={[styles.errorTitle, { color: Colors.text }]}>
 Development Build Required
 </Text>
 <Text style={[styles.errorText, { color: Colors.lightText }]}>
 The Interview Simulator requires native modules and cannot run in Expo Go.
 </Text>
 <Text style={[styles.errorText, { color: Colors.lightText, marginTop: 12 }]}>
 Please build a development build using:
 </Text>
 <View style={[styles.codeBlock, { backgroundColor: Colors.card }]}>
 <Text style={[styles.codeText, { color: Colors.text }]}>
 npx expo run:ios
 </Text>
 <Text style={[styles.codeText, { color: Colors.text, marginTop: 8 }]}>
 npx expo run:android
 </Text>
 </View>
 </View>
 </View>
 );
 }

 // Render the actual interview content (with ElevenLabs hooks)
 return <InterviewContent />;
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 },
 loadingContainer: {
 flex: 1,
 justifyContent: "center",
 alignItems: "center",
 padding: 24,
 },
 loadingText: {
 marginTop: 16,
 fontSize: 16,
 },
 lockedContainer: {
 flex: 1,
 justifyContent: "center",
 alignItems: "center",
 padding: 24,
 },
 lockedIconContainer: {
 width: 100,
 height: 100,
 borderRadius: 50,
 justifyContent: "center",
 alignItems: "center",
 marginBottom: 24,
 },
 lockedTitle: {
 fontSize: 28,
 fontWeight: "700",
 marginBottom: 12,
 textAlign: "center",
 },
 lockedDescription: {
 fontSize: 16,
 textAlign: "center",
 lineHeight: 24,
 marginBottom: 24,
 maxWidth: 320,
 },
 featureCard: {
 padding: 20,
 marginBottom: 24,
 width: "100%",
 },
 featureRow: {
 flexDirection: "row",
 alignItems: "flex-start",
 gap: 16,
 },
 featureTextContainer: {
 flex: 1,
 },
 featureTitle: {
 fontSize: 18,
 fontWeight: "600",
 marginBottom: 8,
 },
 featureText: {
 fontSize: 14,
 lineHeight: 22,
 },
 upgradeButton: {
 marginBottom: 16,
 },
 backLink: {
 padding: 12,
 },
 backLinkText: {
 fontSize: 16,
 fontWeight: "500",
 },
 scrollContainer: {
 flex: 1,
 },
 content: {
 padding: 20,
 paddingBottom: 40,
 },
 header: {
 alignItems: "center",
 marginBottom: 20,
 },
 inlineBackButton: {
 alignSelf: "flex-start",
 padding: 8,
 borderRadius: 999,
 marginBottom: 12,
 },
 iconContainer: {
 width: 70,
 height: 70,
 borderRadius: 35,
 justifyContent: "center",
 alignItems: "center",
 marginBottom: 12,
 },
 title: {
 fontSize: 24,
 fontWeight: "700",
 marginBottom: 6,
 textAlign: "center",
 },
 subtitle: {
 fontSize: 14,
 textAlign: "center",
 lineHeight: 20,
 },
 micSection: {
 alignItems: "center",
 marginBottom: 24,
 },
 pulseWrapper: {
 padding: 12,
 borderRadius: 999,
 },
 micButton: {
 width: 120,
 height: 120,
 borderRadius: 60,
 justifyContent: "center",
 alignItems: "center",
 shadowColor: "#000",
 shadowOffset: { width: 0, height: 8 },
 shadowOpacity: 0.15,
 shadowRadius: 16,
 elevation: 6,
 },
 micTouchable: {
 width: 120,
 height: 120,
 justifyContent: "center",
 alignItems: "center",
 borderRadius: 60,
 },
 micStatus: {
 fontSize: 16,
 fontWeight: "700",
 marginTop: 12,
 textAlign: "center",
 },
 micHint: {
 fontSize: 14,
 marginTop: 6,
 textAlign: "center",
 },
 messagesCard: {
 padding: 16,
 marginBottom: 16,
 minHeight: 280,
 maxHeight: 400,
 },
 messagesTitle: {
 fontSize: 18,
 fontWeight: "600",
 marginBottom: 12,
 },
 messagesScrollView: {
 flex: 1,
 minHeight: 200,
 },
 messagesContainer: {
 gap: 12,
 paddingBottom: 8,
 },
 emptyMessages: {
 flex: 1,
 justifyContent: "center",
 alignItems: "center",
 minHeight: 150,
 },
 emptyText: {
 fontSize: 14,
 textAlign: "center",
 },
 messageBubble: {
 padding: 12,
 borderRadius: 12,
 maxWidth: "90%",
 },
 userMessage: {
 alignSelf: "flex-end",
 },
 agentMessage: {
 alignSelf: "flex-start",
 },
 systemMessage: {
 alignSelf: "center",
 maxWidth: "100%",
 },
 messageLabel: {
 fontSize: 11,
 fontWeight: "600",
 marginBottom: 4,
 textTransform: "uppercase",
 },
 messageText: {
 fontSize: 15,
 lineHeight: 22,
 },
 systemMessageText: {
 textAlign: "center",
 fontStyle: "italic",
 fontSize: 13,
 },
 controls: {
 flexDirection: "row",
 gap: 12,
 marginBottom: 16,
 },
 primaryButton: {
 flex: 1,
 flexDirection: "row",
 alignItems: "center",
 justifyContent: "center",
 paddingVertical: 16,
 borderRadius: 12,
 gap: 8,
 },
 primaryButtonText: {
 color: "#FFFFFF",
 fontSize: 16,
 fontWeight: "600",
 },
 secondaryButton: {
 flex: 1,
 flexDirection: "row",
 alignItems: "center",
 justifyContent: "center",
 paddingVertical: 16,
 borderRadius: 12,
 borderWidth: 2,
 gap: 8,
 },
 secondaryButtonText: {
 fontSize: 16,
 fontWeight: "600",
 },
 dangerButton: {
 flex: 1,
 flexDirection: "row",
 alignItems: "center",
 justifyContent: "center",
 paddingVertical: 16,
 borderRadius: 12,
 gap: 8,
 },
 dangerButtonText: {
 color: "#FFFFFF",
 fontSize: 16,
 fontWeight: "600",
 },
 errorBanner: {
 padding: 12,
 marginBottom: 16,
 borderWidth: 1,
 borderRadius: 12,
 },
 errorBannerContent: {
 flexDirection: "row",
 alignItems: "center",
 gap: 10,
 },
 errorBannerText: {
 flex: 1,
 fontSize: 14,
 fontWeight: "500",
 },
 feedbackCard: {
 padding: 16,
 },
 feedbackTitle: {
 fontSize: 16,
 fontWeight: "600",
 marginBottom: 12,
 textAlign: "center",
 },
 feedbackButtons: {
 flexDirection: "row",
 gap: 12,
 },
 feedbackButton: {
 flex: 1,
 paddingVertical: 12,
 paddingHorizontal: 16,
 borderRadius: 8,
 alignItems: "center",
 },
 feedbackButtonText: {
 fontSize: 14,
 fontWeight: "600",
 },
 errorContainer: {
 flex: 1,
 justifyContent: "center",
 alignItems: "center",
 padding: 24,
 },
 errorIconContainer: {
 width: 100,
 height: 100,
 borderRadius: 50,
 justifyContent: "center",
 alignItems: "center",
 marginBottom: 24,
 },
 errorTitle: {
 fontSize: 24,
 fontWeight: "700",
 marginBottom: 12,
 textAlign: "center",
 },
 errorText: {
 fontSize: 16,
 textAlign: "center",
 lineHeight: 24,
 marginBottom: 8,
 },
 codeBlock: {
 padding: 16,
 borderRadius: 8,
 marginTop: 16,
 marginBottom: 24,
 width: "100%",
 },
 codeText: {
 fontSize: 14,
 fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
 },
});
