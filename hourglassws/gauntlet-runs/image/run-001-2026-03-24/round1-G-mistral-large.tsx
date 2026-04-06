```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { springBouncy, springSnappy, timingInstant } from '@/src/lib/reanimated-presets';
import AnimatedPressable from './AnimatedPressable';
import GlassCard from './GlassCard';
import { useHapticFeedback } from 'expo-haptics';

interface Props {
  item: ApprovalItem;
  onApprove: () => void;
  onReject: () => void;
}

interface ApprovalItem {
  fullName: string;
  hours: number;
  description: string;
  category: 'MANUAL' | 'OVERTIME';
  approvalId: string;
  cost?: number;
}

const ApprovalCard: React.FC<Props> = ({ item, onApprove, onReject }) => {
  const translateX = useSharedValue(0);
  const { hapticFeedback } = useHapticFeedback();

  const panGesture = Gesture.Pan()
    .onStart(() => {
      hapticFeedback('impactLight');
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.velocityX > 0 && event.translationX > 100) {
        translateX.value = withSpring(200, springSnappy, () => runOnJS(onApprove)());
      } else if (event.velocityX < 0 && event.translationX < -100) {
        translateX.value = withSpring(-200, springSnappy, () => runOnJS(onReject)());
      } else {
        translateX.value = withSpring(0, springBouncy);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleApprove = () => {
    translateX.value = withSpring(200, springSnappy, () => runOnJS(onApprove)());
  };

  const handleReject = () => {
    translateX.value = withSpring(-200, springSnappy, () => runOnJS(onReject)());
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle} className="relative">
        <View className="absolute inset-0 flex flex-row">
          <View className="flex-1 bg-destructive" />
          <View className="flex-1 bg-success" />
        </View>
        <GlassCard className="p-5 rounded-2xl">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-textPrimary font-display-semibold">{item.fullName}</Text>
            <Text className="text-textSecondary font-mono tabular-nums">{item.hours}h</Text>
          </View>
          <Text className="text-textSecondary mb-2">{item.description}</Text>
          <View className={`px-2 py-1 rounded-full ${item.category === 'MANUAL' ? 'bg-violet' : 'bg-warning'}`}>
            <Text className="text-textPrimary font-sans-semibold text-xs">{item.category}</Text>
          </View>
          {item.category === 'OVERTIME' && item.cost && (
            <Text className="text-gold font-display-semibold mt-2">${item.cost.toFixed(2)}</Text>
          )}
          <View className="flex-row justify-between mt-4">
            <AnimatedPressable onPress={handleReject} className="px-4 py-2 bg-surfaceElevated rounded-lg">
              <Text className="text-destructive font-sans-semibold">Reject</Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={handleApprove} className="px-4 py-2 bg-surfaceElevated rounded-lg">
              <Text className="text-success font-sans-semibold">Approve</Text>
            </AnimatedPressable>
          </View>
        </GlassCard>
      </Animated.View>
    </GestureDetector>
  );
};

export default ApprovalCard;
```
