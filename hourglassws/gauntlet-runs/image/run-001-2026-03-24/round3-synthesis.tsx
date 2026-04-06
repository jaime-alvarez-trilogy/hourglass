// ApprovalCard — swipeable manager approval card
//
// Design: Liquid Glass dark surface per BRAND_GUIDELINES.md v2.0
// Gesture: Gesture.Pan() from react-native-gesture-handler (no legacy Animated/PanResponder)
// Swipe right = approve (green revealed behind), swipe left = reject (red revealed behind)
// The fix: swipe color revealed via animated WIDTH matching translateX — not opacity bleed-through

import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { springBouncy, springSnappy, timingInstant } from '@/src/lib/reanimated-presets';
import type { ApprovalItem, OvertimeApprovalItem } from '@/src/lib/approvals';
import { colors } from '@/src/lib/colors';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  item: ApprovalItem;
  onApprove: () => void;
  onReject: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 100;
const DISMISS_VELOCITY = 800;

// ─── Type guard ──────────────────────────────────────────────────────────────

function isOvertime(item: ApprovalItem): item is OvertimeApprovalItem {
  return item.category === 'OVERTIME';
}

// ─── Internal: AnimatedButton ─────────────────────────────────────────────────
// Tap gesture with scale press feedback — meets BRAND_GUIDELINES §6.5

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
}

function AnimatedButton({ children, onPress, className = '' }: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const tap = Gesture.Tap()
    .onBegin(() => {
      if (!reducedMotion) scale.value = withTiming(0.96, timingInstant);
    })
    .onFinalize(() => {
      if (!reducedMotion) scale.value = withTiming(1, timingInstant);
    })
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={animStyle} className={className}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ApprovalCard({ item, onApprove, onReject }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const overtime = isOvertime(item);

  // ── Callbacks (JS thread) ──────────────────────────────────────────────────

  const triggerApprove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApprove();
  };

  const triggerReject = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onReject();
  };

  const triggerLight = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── Pan Gesture ────────────────────────────────────────────────────────────

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-8, 8])
    .onStart(() => {
      startX.value = translateX.value;
      runOnJS(triggerLight)();
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
    })
    .onEnd((e) => {
      const shouldApprove =
        !reducedMotion &&
        (translateX.value > SWIPE_THRESHOLD || e.velocityX > DISMISS_VELOCITY);
      const shouldReject =
        !reducedMotion &&
        (translateX.value < -SWIPE_THRESHOLD || e.velocityX < -DISMISS_VELOCITY);

      if (shouldApprove) {
        translateX.value = withSpring(screenWidth * 1.2, springSnappy);
        cardOpacity.value = withTiming(0, { duration: 250 });
        runOnJS(triggerApprove)();
      } else if (shouldReject) {
        translateX.value = withSpring(-screenWidth * 1.2, springSnappy);
        cardOpacity.value = withTiming(0, { duration: 250 });
        runOnJS(triggerReject)();
      } else {
        translateX.value = withSpring(0, springBouncy);
      }
    });

  // ── Animated Styles ────────────────────────────────────────────────────────

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-screenWidth * 0.5, 0, screenWidth * 0.5],
      [-6, 0, 6],
      Extrapolation.CLAMP
    );
    return {
      opacity: cardOpacity.value,
      transform: [
        { translateX: translateX.value },
        { rotate: reducedMotion ? '0deg' : `${rotation}deg` },
      ],
    };
  });

  // THE FIX: Animate the WIDTH of each action background to exactly match
  // the uncovered area. This prevents any color from showing through the card.

  const approveActionStyle = useAnimatedStyle(() => {
    const revealWidth = interpolate(
      translateX.value,
      [0, screenWidth],
      [0, screenWidth],
      Extrapolation.CLAMP
    );
    return {
      width: Math.max(0, revealWidth),
      opacity: interpolate(translateX.value, [0, 40], [0, 1], Extrapolation.CLAMP),
    };
  });

  const rejectActionStyle = useAnimatedStyle(() => {
    const revealWidth = interpolate(
      translateX.value,
      [-screenWidth, 0],
      [screenWidth, 0],
      Extrapolation.CLAMP
    );
    return {
      width: Math.max(0, revealWidth),
      opacity: interpolate(translateX.value, [-40, 0], [1, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <View className="px-4 my-2">
      <View className="relative">
        {/* ── Layer 0: Approve indicator — revealed on right as card slides right ── */}
        <Animated.View
          style={approveActionStyle}
          className="absolute left-0 top-0 bottom-0 bg-success rounded-2xl items-center justify-center overflow-hidden"
          pointerEvents="none"
        >
          <Ionicons name="checkmark" size={28} color={colors.background} />
          <Text
            className="text-background font-sans-bold text-[10px] uppercase mt-1"
            style={{ letterSpacing: 1 }}
          >
            Approve
          </Text>
        </Animated.View>

        {/* ── Layer 0: Reject indicator — revealed on left as card slides left ── */}
        <Animated.View
          style={rejectActionStyle}
          className="absolute right-0 top-0 bottom-0 bg-destructive rounded-2xl items-center justify-center overflow-hidden"
          pointerEvents="none"
        >
          <Ionicons name="close" size={28} color={colors.background} />
          <Text
            className="text-background font-sans-bold text-[10px] uppercase mt-1"
            style={{ letterSpacing: 1 }}
          >
            Reject
          </Text>
        </Animated.View>

        {/* ── Layer 1: Swipeable glass card ─────────────────────────────────── */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={cardStyle}
            className="rounded-2xl border border-border bg-surface overflow-hidden"
            renderToHardwareTextureAndroid
          >
            {/* Top highlight — simulates glass top edge catching light */}
            <View
              className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              pointerEvents="none"
            />

            <View className="p-5">
              {/* Header: name + badge */}
              <View className="flex-row items-start justify-between mb-3">
                <Text
                  className="text-textPrimary font-display-semibold text-base flex-1 mr-3"
                  numberOfLines={1}
                >
                  {item.fullName}
                </Text>

                <View
                  className={`px-2.5 py-1 rounded-xl ${
                    overtime ? 'bg-warning/15' : 'bg-violet/15'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-sans-semibold uppercase ${
                      overtime ? 'text-warning' : 'text-violet'
                    }`}
                    style={{ letterSpacing: 0.8 }}
                  >
                    {item.category}
                  </Text>
                </View>
              </View>

              {/* Hours + cost row */}
              <View className="flex-row items-baseline gap-4 mb-3">
                <Text
                  className="text-textPrimary font-mono text-xl"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {item.hours}
                  <Text className="text-textSecondary font-sans text-sm"> hrs</Text>
                </Text>

                {overtime && (
                  <Text
                    className="text-gold font-mono text-base"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    ${(item as OvertimeApprovalItem).cost.toFixed(2)}
                  </Text>
                )}
              </View>

              {/* Description */}
              <Text
                className="text-textSecondary font-sans text-sm leading-5 mb-4"
                numberOfLines={2}
              >
                {item.description}
              </Text>

              {/* Divider */}
              <View className="h-[1px] bg-border mb-4" />

              {/* Fallback action buttons */}
              <View className="flex-row gap-3">
                <AnimatedButton
                  onPress={onReject}
                  className="flex-1 bg-destructive/10 border border-destructive/25 rounded-xl py-3 items-center"
                >
                  <Text className="text-destructive font-sans-semibold text-sm">Reject</Text>
                </AnimatedButton>

                <AnimatedButton
                  onPress={onApprove}
                  className="flex-1 bg-success/10 border border-success/25 rounded-xl py-3 items-center"
                >
                  <Text className="text-success font-sans-semibold text-sm">Approve</Text>
                </AnimatedButton>
              </View>

              {/* Swipe hint */}
              <Text
                className="text-textMuted font-sans text-xs text-center mt-3"
                style={{ letterSpacing: 0.5 }}
              >
                ← reject · approve →
              </Text>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

export default ApprovalCard;
