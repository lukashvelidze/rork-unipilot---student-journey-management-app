import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Easing, Dimensions } from "react-native";
import { Platform } from "react-native";
import Colors from "@/constants/colors";

interface CelebrationAnimationProps {
  visible: boolean;
  onAnimationFinish?: () => void;
  type?: "confetti" | "achievement" | "milestone" | "stage_complete";
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

  // Simple celebration animation without Lottie
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
        <View style={styles.celebration}>
          {type === "achievement" && (
            <View style={styles.achievementCircle}>
              <View style={styles.star} />
            </View>
          )}
          {(type === "milestone" || type === "stage_complete") && (
            <View style={styles.milestoneContainer}>
              <View style={styles.milestone} />
              <View style={[styles.milestone, styles.milestone2]} />
              <View style={[styles.milestone, styles.milestone3]} />
            </View>
          )}
          {type === "confetti" && (
            <View style={styles.confettiContainer}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.confetti, 
                    { 
                      backgroundColor: [Colors.primary, Colors.success, "#FFD700", "#FF6B6B"][i % 4],
                      top: Math.random() * height * 0.7,
                      left: Math.random() * width * 0.9,
                      transform: [
                        { rotate: `${Math.random() * 360}deg` },
                        { scale: 0.5 + Math.random() * 1.5 }
                      ]
                    }
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
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
  celebration: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  achievementCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  star: {
    width: 60,
    height: 60,
    backgroundColor: Colors.white,
    borderRadius: 30,
  },
  milestoneContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  milestone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    margin: 8,
  },
  milestone2: {
    backgroundColor: Colors.success,
    transform: [{ scale: 1.2 }],
  },
  milestone3: {
    backgroundColor: "#FFD700",
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

export default CelebrationAnimation;