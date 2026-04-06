

```tsx
import React, { useCallback } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
  useReducedMotion,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Preset Springs & Timings ───────────────────────────────────────────────
const springBouncy = { damping: 14, stiffness: 200, mass: 1 };
const springSnappy = { damping: 20, stiffness: 300, mass: 0.8 };
const timingInstant = { duration: 150 };

// ─── Types ──────────────────────────────────────────────────────────────────
interface ApprovalItem {
  fullName: string;
  hours: number;
  description: string;
  category: 'MANUAL' | 'OVERTIME';
  approvalId: string;
}

interface OvertimeApprovalItem extends ApprovalItem {
  category: 'OVERTIME';
  cost: number;
}

type ApprovalItemUnion = ApprovalItem | OvertimeApprovalItem;

interface ApprovalCardProps {
  item: ApprovalItemUnion;
  onApprove: () => void;
  onReject: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function isOvertime(item: ApprovalItemUnion): item is OvertimeApprovalItem {
  return item.category === 'OVERTIME' && 'cost' in item;
}

function formatHours(h: number): string {
  return h % 1 === 0 ? `${h}.0` : `${h}`;
}

function formatCost(c: number): string {
  return `$${c.toFixed(2)}`;
}

// ─── Threshold Constants ────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 120;
const DISMISS_VELOCITY = 500;

// ─── Component ──────────────────────────────────────────────────────────────
export default function ApprovalCard({ item, onApprove, onReject }: ApprovalCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const approveButtonScale = useSharedValue(1);
  const rejectButtonScale = useSharedValue(1);

  // ── Callbacks (must run on JS thread) ───────────────────────────────────
  const handleApprove = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApprove();
  }, [onApprove]);

  const handleReject = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onReject();
  }, [onReject]);

  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ── Pan Gesture ─────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
    })
    .onEnd((event) => {
      const shouldDismissRight =
        translateX.value > SWIPE_THRESHOLD || event.velocityX > DISMISS_VELOCITY;
      const shouldDismissLeft =
        translateX.value < -SWIPE_THRESHOLD || event.velocityX < -DISMISS_VELOCITY;

      if (shouldDismissRight) {
        translateX.value = withSpring(screenWidth * 1.2, springSnappy);
        cardOpacity.value = withTiming(0, { duration: 300 });
        runOnJS(triggerLightHaptic)();
        runOnJS(handleApprove)();
      } else if (shouldDismissLeft) {
        translateX.value = withSpring(-screenWidth * 1.2, springSnappy);
        cardOpacity.value = withTiming(0, { duration: 300 });
        runOnJS(triggerLightHaptic)();
        runOnJS(handleReject)();
      } else {
        translateX.value = withSpring(0, springBouncy);
      }
    });

  // ── Animated Styles ─────────────────────────────────────────────────────

  // The card itself translates
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-screenWidth * 0.5, 0, screenWidth * 0.5],
      [-8, 0, 8],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotation}deg` },
      ],
      opacity: cardOpacity.value,
    };
  });

  // Approve indicator (revealed on right side BEHIND the card)
  const approveIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.6, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Reject indicator (revealed on left side BEHIND the card)
  const rejectIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
      [1, 0.5, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0.6],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Border gradient color shifts based on swipe direction
  const borderOverlayStyle = useAnimatedStyle(() => {
    const approveOpacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 0.8],
      Extrapolation.CLAMP
    );
    const rejectOpacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [0.8, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity: Math.max(approveOpacity, rejectOpacity),
    };
  });

  // ── Button press handlers ───────────────────────────────────────────────
  const approvePress = Gesture.Tap()
    .onBegin(() => {
      approveButtonScale.value = withTiming(0.96, timingInstant);
    })
    .onFinalize(() => {
      approveButtonScale.value = withTiming(1, timingInstant);
    })
    .onEnd(() => {
      runOnJS(handleApprove)();
    });

  const rejectPress = Gesture.Tap()
    .onBegin(() => {
      rejectButtonScale.value = withTiming(0.96, timingInstant);
    })
    .onFinalize(() => {
      rejectButtonScale.value = withTiming(1, timingInstant);
    })
    .onEnd(() => {
      runOnJS(handleReject)();
    });

  const approveButtonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: approveButtonScale.value }],
  }));

  const rejectButtonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rejectButtonScale.value }],
  }));

  const overtime = isOvertime(item);

  return (
    <View className="relative mx-4 my-2">
      {/* ── LAYER 0: Swipe indicators BEHIND the card ─────────────────── */}

      {/* Approve indicator — left side (revealed when card moves right) */}
      <Animated.View
        style={[approveIndicatorStyle]}
        className="absolute left-4 top-0 bottom-0 items-center justify-center z-0"
      >
        <View className="w-14 h-14 rounded-2xl bg-success/20 items-center justify-center">
          <Text className="text-success text-2xl font-display-bold">✓</Text>
        </View>
        <Text className="text-success text-xs font-sans-semibold mt-2 uppercase tracking-widest">
          Approve
        </Text>
      </Animated.View>

      {/* Reject indicator — right side (revealed when card moves left) */}
      <Animated.View
        style={[rejectIndicatorStyle]}
        className="absolute right-4 top-0 bottom-0 items-center justify-center z-0"
      >
        <View className="w-14 h-14 rounded-2xl bg-destructive/20 items-center justify-center">
          <Text className="text-destructive text-2xl font-display-bold">✕</Text>
        </View>
        <Text className="text-destructive text-xs font-sans-semibold mt-2 uppercase tracking-widest">
          Reject
        </Text>
      </Animated.View>

      {/* ── LAYER 1: The actual glass card (translates on swipe) ──────── */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[cardAnimatedStyle]}
          className="z-10"
          renderToHardwareTextureAndroid
        >
          {/* Gradient border wrapper */}
          <View className="rounded-2xl p-[1.5px] overflow-hidden">
            {/* Default violet gradient border */}
            <LinearGradient
              colors={['#A78BFA', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 16,
              }}
            />

            {/* Solid dark glass card interior — NEVER transparent */}
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'rgba(22, 21, 31, 0.95)' }}
            >
              {/* Inner glass surface */}
              <View
                className="p-5"
                style={{ backgroundColor: 'rgba(22, 21, 31, 0.60)' }}
              >
                {/* Top row: Name + Badge */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text
                      className="text-textPrimary text-base font-sans-semibold"
                      numberOfLines={1}
                    >
                      {item.fullName}
                    </Text>
                  </View>

                  {/* Category badge */}
                  <View
                    className={`px-3 py-1 rounded-xl ${
                      overtime ? 'bg-warning/15' : 'bg-violet/15'
                    }`}
                  >
                    <Text
                      className={`text-xs font-sans-semibold uppercase ${
                        overtime ? 'text-warning' : 'text-violet'
                      }`}
                      style={{ letterSpacing: 0.8 }}
                    >
                      {overtime ? 'Overtime' : 'Manual'}
                    </Text>
                  </View>
                </View>

                {/* Hours + Cost row */}
                <View className="flex-row items-baseline mb-3 gap-4">
                  <View className="flex-row items-baseline">
                    <Text
                      className="text-textPrimary text-2xl font-display-bold"
                      style={{
                        fontVariant: ['tabular-nums'],
                        letterSpacing: -0.5,
                      }}
                    >
                      {formatHours(item.hours)}
                    </Text>
                    <Text className="text-textSecondary text-sm font-sans-medium ml-1">
                      hrs
                    </Text>
                  </View>

                  {overtime && (
                    <View className="flex-row items-baseline">
                      <Text
                        className="text-gold text-lg font-display-semibold"
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        {formatCost((item as OvertimeApprovalItem).cost)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                <Text
                  className="text-textSecondary text-sm font-sans leading-5 mb-4"
                  numberOfLines={3}
                >
                  {item.description}
                </Text>

                {/* Divider */}
                <View className="h-[1px] bg-border mb-4" />

                {/* Action buttons — accessibility fallback */}
                <View className="flex-row gap-3">
                  <GestureDetector gesture={rejectPress}>
                    <Animated.View
                      style={[rejectButtonAnimStyle]}
                      className="flex-1 py-3 rounded-xl items-center justify-center border border-destructive/30 bg-destructive/10"
                    >
                      <Text className="text-destructive text-sm font-sans-semibold">
                        Reject
                      </Text>
                    </Animated.View>
                  </GestureDetector>

                  <GestureDetector gesture={approvePress}>
                    <Animated.View
                      style={[approveButtonAnimStyle]}
                      className="flex-1 py-3 rounded-xl items-center justify-center border border-success/30 bg-success/10"
                    >
                      <Text className="text-success text-sm font-sans-semibold">
                        Approve
                      </Text>
                    </Animated.View>
                  </GestureDetector>
                </View>

                {/* Swipe hint */}
                <Text
                  className="text-textMuted text-xs font-sans text-center mt-3"
                  style={{ letterSpacing: 0.5 }}
                >
                  ← swipe to reject · swipe to approve →
                </Text>
              </View>

              {/* Inner shadow overlays for glass depth */}
              <View
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                pointerEvents="none"
              />
              <View
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                pointerEvents="none"
              />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export { ApprovalCard, type ApprovalCardProps, type ApprovalItem, type OvertimeApprovalItem };
```
