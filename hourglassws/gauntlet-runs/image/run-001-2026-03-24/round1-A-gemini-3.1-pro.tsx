```tsx
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Dimensions, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check, X, Clock, DollarSign, AlertCircle } from 'lucide-react-native';

// --- TYPES ---
export interface ApprovalItem {
  approvalId: string;
  fullName: string;
  hours: number;
  description: string;
  category: 'MANUAL' | 'OVERTIME';
  cost?: number;
}

export interface ApprovalCardProps {
  item: ApprovalItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

// --- ANIMATION PRESETS (from design system) ---
const springSnappy = { damping: 20, stiffness: 300, mass: 0.8 };
const springBouncy = { damping: 14, stiffness: 200, mass: 1 };
const timingInstant = { duration: 150, easing: Easing.out(Easing.ease) };

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;

// --- INLINE COMPONENTS ---

/**
 * AnimatedPressable ensures strict compliance with button press scale rules
 * Scale 1.0 -> 0.96 with timingInstant, restore on release.
 */
const AnimatedPressable = ({
  children,
  onPress,
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
  disabled?: boolean;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, timingInstant);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, timingInstant);
  };

  return (
    <Animated.View style={animatedStyle} className="flex-1">
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        className={className}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

// --- MAIN COMPONENT ---

export default function ApprovalCard({ item, onApprove, onReject }: ApprovalCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [cardHeight, setCardHeight] = useState(200); // Fallback height until layout

  // Shared Values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const height = useSharedValue(-1); // -1 means auto (before dismiss)
  const marginBottom = useSharedValue(16); // gap-4 equivalent

  // Haptic state guards
  const hasCrossedRight = useSharedValue(false);
  const hasCrossedLeft = useSharedValue(false);

  // --- ACTIONS ---
  const triggerHaptic = useCallback((type: 'success' | 'warning') => {
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  const finalizeDismiss = useCallback(
    (action: 'approve' | 'reject') => {
      setIsDismissed(true);
      if (action === 'approve') onApprove(item.approvalId);
      if (action === 'reject') onReject(item.approvalId);
    },
    [item.approvalId, onApprove, onReject]
  );

  const dismissCard = useCallback(
    (direction: 1 | -1, action: 'approve' | 'reject') => {
      'worklet';
      translateX.value = withSpring(direction * SCREEN_WIDTH, springSnappy);
      opacity.value = withTiming(0, timingInstant);
      height.value = withTiming(0, timingInstant);
      marginBottom.value = withTiming(0, timingInstant, (finished) => {
        if (finished) {
          runOnJS(finalizeDismiss)(action);
        }
      });
    },
    [translateX, opacity, height, marginBottom, finalizeDismiss]
  );

  // --- GESTURE ---
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Prevent vertical scroll hijack
    .onUpdate((e) => {
      translateX.value = e.translationX;

      // Haptic feedback thresholds
      if (e.translationX > SWIPE_THRESHOLD && !hasCrossedRight.value) {
        hasCrossedRight.value = true;
        runOnJS(triggerHaptic)('success');
      } else if (e.translationX < SWIPE_THRESHOLD && hasCrossedRight.value) {
        hasCrossedRight.value = false;
      }

      if (e.translationX < -SWIPE_THRESHOLD && !hasCrossedLeft.value) {
        hasCrossedLeft.value = true;
        runOnJS(triggerHaptic)('warning');
      } else if (e.translationX > -SWIPE_THRESHOLD && hasCrossedLeft.value) {
        hasCrossedLeft.value = false;
      }
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        dismissCard(1, 'approve');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        dismissCard(-1, 'reject');
      } else {
        translateX.value = withSpring(0, springBouncy);
      }
    });

  // --- ANIMATED STYLES ---
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    height: height.value === -1 ? 'auto' : height.value,
    marginBottom: marginBottom.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // THE FIX: Animate width of swipe backgrounds to match translation exactly.
  // This prevents the vibrant green/red from sitting directly behind the translucent glass card 
  // and bleeding through the dark surface.
  const leftActionStyle = useAnimatedStyle(() => ({
    width: Math.max(0, translateX.value),
    opacity: interpolate(translateX.value, [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    width: Math.max(0, -translateX.value),
    opacity: interpolate(-translateX.value, [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    if (height.value === -1) {
      setCardHeight(e.nativeEvent.layout.height);
      height.value = e.nativeEvent.layout.height; // Set absolute height for smooth collapse
    }
  };

  if (isDismissed) return null;

  const isOvertime = item.category === 'OVERTIME';

  return (
    <Animated.View style={containerStyle} className="w-full overflow-hidden px-4">
      <View onLayout={onLayout} className="relative w-full rounded-2xl">
        
        {/* LEFT ACTION (APPROVE - GREEN) */}
        {/* Anchored to the left, grows precisely with the swipe to avoid under-card bleed */}
        <Animated.View
          style={leftActionStyle}
          className="absolute left-0 top-0 bottom-0 bg-success rounded-2xl flex-row items-center justify-start pl-6 overflow-hidden"
        >
          <View className="flex-col items-center">
            <Check size={28} color="#0D0C14" strokeWidth={3} />
            <Text className="text-[#0D0C14] font-sans-bold text-[11px] uppercase tracking-widest mt-1">
              Approve
            </Text>
          </View>
        </Animated.View>

        {/* RIGHT ACTION (REJECT - RED) */}
        {/* Anchored to the right, grows precisely with the swipe to avoid under-card bleed */}
        <Animated.View
          style={rightActionStyle}
          className="absolute right-0 top-0 bottom-0 bg-destructive rounded-2xl flex-row items-center justify-end pr-6 overflow-hidden"
        >
          <View className="flex-col items-center">
            <X size={28} color="#0D0C14" strokeWidth={3} />
            <Text className="text-[#0D0C14] font-sans-bold text-[11px] uppercase tracking-widest mt-1">
              Reject
            </Text>
          </View>
        </Animated.View>

        {/* FOREGROUND CARD */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={cardStyle}
            className="w-full rounded-2xl border border-[#2F2E41] bg-[#16151F]/90 overflow-hidden"
          >
            {/* Inner Glass Layer Stack Reflection Simulation */}
            <View className="absolute inset-0 border-t border-white/5 rounded-2xl pointer-events-none" />
            
            <View className="p-5">
              {/* Header: Name & Badge */}
              <View className="flex-row justify-between items-start mb-3">
                <Text className="text-[#E0E0E0] font-display-semibold text-lg flex-1 mr-3 tracking-tight">
                  {item.fullName}
                </Text>
                
                <View
                  className={`px-2.5 py-1 rounded-lg border flex-row items-center ${
                    isOvertime
                      ? 'bg-warning/10 border-warning/20'
                      : 'bg-violet/10 border-violet/20'
                  }`}
                >
                  {isOvertime && <AlertCircle size={12} color="#F59E0B" className="mr-1.5" />}
                  <Text
                    className={`font-sans-medium text-[11px] uppercase tracking-widest ${
                      isOvertime ? 'text-warning' : 'text-violet'
                    }`}
                  >
                    {item.category}
                  </Text>
                </View>
              </View>

              {/* Body: Description */}
              <Text className="text-[#A0A0A0] font-sans text-sm leading-relaxed mb-5" numberOfLines={2}>
                {item.description}
              </Text>

              {/* Data Row */}
              <View className="flex-row items-center mb-5 gap-6">
                <View className="flex-row items-center">
                  <Clock size={16} color="#757575" className="mr-2" />
                  <Text className="text-[#E0E0E0] font-mono tabular-nums font-semibold text-base">
                    {item.hours.toFixed(1)} <Text className="text-[#757575] font-sans font-normal text-sm">hrs</Text>
                  </Text>
                </View>

                {isOvertime && item.cost !== undefined && (
                  <View className="flex-row items-center">
                    <DollarSign size={16} color="#E8C97A" className="mr-1.5" />
                    <Text className="text-gold font-mono tabular-nums font-semibold text-base">
                      {item.cost.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Footer Fallback Actions */}
              <View className="flex-row gap-3 pt-5 border-t border-[#2F2E41]">
                <AnimatedPressable
                  onPress={() => dismissCard(-1, 'reject')}
                  className="flex-1 bg-[#1F1E29] rounded-xl py-3 border border-[#2F2E41] items-center justify-center"
                >
                  <Text className="text-[#E0E0E0] font-sans-semibold text-sm">Reject</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => dismissCard(1, 'approve')}
                  className="flex-1 bg-violet/10 rounded-xl py-3 border border-violet/30 items-center justify-center"
                >
                  <Text className="text-violet font-sans-semibold text-sm">Approve</Text>
                </AnimatedPressable>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}
```
