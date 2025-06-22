import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Easing, Dimensions } from "react-native";
import { LottieView } from "lottie-react-native";
import Colors from "@/constants/colors";

interface CelebrationAnimationProps {
  visible: boolean;
  onAnimationFinish?: () => void;
  type?: "confetti" | "achievement" | "milestone";
}

const { width, height } = Dimensions.get("window");

const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  visible,
  onAnimationFinish,
  type = "confetti",
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.elastic(1.2),
        }),
      ]).start();

      // Auto-hide after animation
      const timer = setTimeout(() => {
        hideAnimation();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      hideAnimation();
    }
  }, [visible]);

  const hideAnimation = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onAnimationFinish) {
        onAnimationFinish();
      }
    });
  };

  if (!visible) return null;

  const getAnimationSource = () => {
    // These are placeholder URLs - in a real app, you would use local assets
    // For this example, we're using Lottie animation URLs
    switch (type) {
      case "achievement":
        return "https://assets5.lottiefiles.com/packages/lf20_touohxv0.json";
      case "milestone":
        return "https://assets6.lottiefiles.com/private_files/lf30_yJWQKB.json";
      case "confetti":
      default:
        return "https://assets2.lottiefiles.com/packages/lf20_u4yrau.json";
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animationContainer,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <LottieView
          source={{ uri: getAnimationSource() }}
          autoPlay
          loop={false}
          style={styles.animation}
          onAnimationFinish={onAnimationFinish}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  animationContainer: {
    width: width,
    height: height,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  animation: {
    width: "100%",
    height: "100%",
  },
});

export default CelebrationAnimation;