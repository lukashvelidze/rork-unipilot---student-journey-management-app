import React, { memo, useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { WebView } from "react-native-webview";

const globeSource = require("@/assets/onboarding/animated-globe.html");

interface AnimatedGlobeProps {
  compact?: boolean;
}

function AnimatedGlobe({ compact = false }: AnimatedGlobeProps) {
  const isFocused = useIsFocused();
  const webViewRef = useRef<WebView>(null);

  const syncAnimationState = useCallback(() => {
    webViewRef.current?.injectJavaScript(
      `window.setGlobeActive?.(${isFocused ? "true" : "false"}); true;`,
    );
  }, [isFocused]);

  useEffect(() => {
    syncAnimationState();
  }, [syncAnimationState]);

  return (
    <View
      accessibilityLabel="Animated rotating globe with flights moving between cities"
      pointerEvents="none"
      style={[styles.viewport, compact && styles.compactViewport]}
    >
      <WebView
        androidLayerType="hardware"
        bounces={false}
        cacheEnabled
        containerStyle={styles.webViewContainer}
        javaScriptEnabled
        onLoad={syncAnimationState}
        originWhitelist={["*"]}
        overScrollMode="never"
        ref={webViewRef}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        source={globeSource}
        style={styles.webView}
      />
    </View>
  );
}

export default memo(AnimatedGlobe);

const styles = StyleSheet.create({
  viewport: {
    alignSelf: "center",
    height: 340,
    overflow: "hidden",
    width: 340,
  },
  compactViewport: {
    height: 276,
    width: 276,
  },
  webViewContainer: {
    backgroundColor: "transparent",
  },
  webView: {
    backgroundColor: "transparent",
    flex: 1,
  },
});
