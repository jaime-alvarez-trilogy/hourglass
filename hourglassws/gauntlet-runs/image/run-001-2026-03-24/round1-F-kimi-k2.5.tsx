 ```tsx
import React, { useCallback } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { springBouncy } from '@/src/lib/reanimated-presets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const DISMISS_DISTANCE = SCREEN_WIDTH * 0.4;

interface ApprovalItem {
  fullName: string;
  hours: number;
  description: string;
  category: 'MANUAL' | 'OVERTIME';
  approvalId: string;
  cost?: number;
}

interface Props {
  item: ApprovalItem;
  onApprove: () => void;
  onReject: () => void;
}

export default function ApprovalCard({ item, onApprove, onReject }: Props) {
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });

  const triggerApproveHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const triggerRejectHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const handleApprove = useCallback(() => {
    triggerApproveHaptic();
    onApprove();
  }, [onApprove, triggerApproveHaptic]);

  const handleReject = useCallback(() => {
    triggerRejectHaptic();
    onReject();
  }, [onReject, triggerRejectHaptic]);

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      translateX.value = context.value.x + event.translationX;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(DISMISS_DISTANCE, springBouncy, () => {
          runOnJS(handleApprove)();
        });
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-DISMISS_DISTANCE, springBouncy, () => {
          runOnJS(handleReject)();
        });
      } else {
        translateX.value = withSpring(0, springBouncy);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD / 2],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [{
      scale: interpolate(
        translateX.value,
        [0, SWIPE_THRESHOLD],
        [0.8, 1],
        Extrapolation.CLAMP
      )
    }]
  }));

  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD / 2],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [{
      scale: interpolate(
        translateX.value,
        [0, -SWIPE_THRESHOLD],
        [0.8, 1],
        Extrapolation.CLAMP
      )
    }]
  }));

  const isOvertime = item.category === 'OVERTIME';
  const displayCategory = isOvertime ? 'Overtime' : 'Manual';
  const badgeBg = isOvertime ? 'bg-warning' : 'bg-violet';
  const badgeText = isOvertime ? 'text-background' : 'text-white';

  return (
    <View className="relative mb-4 rounded-2xl overflow-hidden">
      {/* Background Indicators - Revealed as card swipes */}
      <View className="absolute inset-0 flex-row">
        {/* Left side - Approve (Green) - Revealed on swipe right */}
        <Animated.View 
          style={leftIndicatorStyle}
          className="flex-1 bg-success items-start justify-center pl-6"
        >
          <Text className="text-background font-display-bold text-xl tracking-tight">
            APPROVE
          </Text>
        </Animated.View>
        
        {/* Right side - Reject (Red) - Revealed on swipe left */}
        <Animated.View 
          style={rightIndicatorStyle}
          className="flex-1 bg-destructive items-end justify-center pr-6"
        >
          <Text className="text-white font-display-bold text-xl tracking-tight">
            REJECT
          </Text>
        </Animated.View>
      </View>

      {/* Main Card - Solid surface to prevent color bleeding */}
      <GestureDetector gesture={gesture}>
        <Animated.View 
          style={animatedCardStyle}
          className="bg-surface rounded-2xl border border-violet/30 p-5 relative z-10"
          renderToHardwareTextureAndroid={true}
        >
          {/* Header Row */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 pr-4">
              <Text 
                className="text-textPrimary font-display-semibold text-lg tracking-tight mb-2"
                style={{ letterSpacing: -0.02 }}
              >
                {item.fullName}
              </Text>
              
              <View className={`self-start px-3 py-1.5 rounded-full ${badgeBg}`}>
                <Text 
                  className={`text-xs font-sans-semibold uppercase tracking-wider ${badgeText}`}
                  style={{ letterSpacing: 0.08 }}
                >
                  {displayCategory}
                </Text>
              </View>
            </View>

            {/* Hours & Cost */}
            <View className="items-end">
              <Text 
                className="text-textPrimary font-mono text-2xl tracking-tight"
                style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.02 }}
              >
                {item.hours.toFixed(1)}h
              </Text>
              
              {isOvertime && item.cost !== undefined && (
                <Text 
                  className="text-gold font-mono text-sm mt-1 tracking-tight"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  ${item.cost.toFixed(2)}
                </Text>
              )}
            </View>
          </View>

          {/* Description */}
          <Text className="text-textSecondary font-sans text-sm leading-relaxed mb-5">
            {item.description}
          </Text>

          {/* Accessibility Fallback Buttons */}
          <View className="flex-row gap-3 pt-4 border-t border-border">
            <Pressable 
              onPress={handleReject}
              className="flex-1 bg-destructive/10 border border-destructive/30 rounded-xl py-3 items-center active:opacity-70"
            >
              <Text className="text-destructive font-sans-semibold text-sm">
                Reject
              </Text>
            </Pressable>
            
            <Pressable 
              onPress={handleApprove}
              className="flex-1 bg-success/10 border border-success/30 rounded-xl py-3 items-center active:opacity-70"
            >
              <Text className="text-success font-sans-semibold text-sm">
                Approve
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
```
