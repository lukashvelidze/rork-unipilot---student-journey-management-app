import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { UI } from "@/constants/design";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Footer pinned under the content (e.g. a primary button). */
  footer?: React.ReactNode;
  /**
   * Called once the slide-in finishes. Focus inputs here rather than with
   * autoFocus: focusing mid-animation drops keystrokes and the focus on iOS.
   */
  onOpened?: () => void;
};

/**
 * Modal bottom sheet: the backdrop fades while the sheet slides, and it
 * stays mounted until the exit animation finishes.
 */
export default function BottomSheet({ visible, onClose, title, children, footer, onOpened }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const onOpenedRef = useRef(onOpened);
  onOpenedRef.current = onOpened;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => finished && onOpenedRef.current?.());
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [mounted, progress, visible]);

  if (!mounted) return null;

  return (
    <Modal transparent visible onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents="box-none"
        style={styles.keyboard}
      >
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
            {
              transform: [
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [480, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity accessibilityLabel="Close" hitSlop={12} onPress={onClose}>
                <X color={UI.text} size={22} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          ) : null}
          {children}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,20,35,0.38)",
  },
  keyboard: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: UI.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#DADAE2",
    borderRadius: 3,
    height: 5,
    marginBottom: 10,
    width: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: UI.text,
    fontSize: 19,
    fontWeight: "700",
  },
  footer: {
    paddingTop: 16,
  },
});
