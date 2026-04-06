```tsx
import React from 'react';
import { Text, View, Button } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { springBouncy } from '@/src/lib/reanimated-presets';
import GlassCard from './GlassCard';
import AnimatedPressable from './AnimatedPressable';

interface ApprovalItem {
  fullName: string;
  hours: number;
  description: string;
  category: 'MANUAL' | 'OVERTIME';
  approvalId: string;
}

interface OvertimeApprovalItem extends ApprovalItem {
  cost: number;
}

interface Props {
  item: ApprovalItem;
  onApprove: () => void;
  onReject: () => void;
}

const ApprovalCard: React.FC<Props> = ({ item, onApprove, onReject }) => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  const handleSwipe = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      if (translateX.value > 100) {
        runOnJS(onApprove)();
      } else if (translateX.value < -100) {
        runOnJS(onReject)();
      }
      translateX.value = withSpring(0, springBouncy);
    });

  return (
    <View className="relative mx-4 my-2">
      <GestureDetector gesture={handleSwipe}>
        <Animated.View className="absolute inset-0 flex-row">
          <View className="bg-success flex-1" />
          <View className="bg-destructive flex-1" />
        </Animated.View>
        <GlassCard className="rounded-2xl p-5" style={animatedStyle}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="textPrimary font-display-bold text-lg">
              {item.fullName}
            </Text>
            <View
              className={`${
                item.category === 'MANUAL' ? 'bg-violet' : 'bg-warning'
              } rounded-full px-2 py-1`}
            >
              <Text
                className="textPrimary uppercase font-sans-medium text-sm"
                style={{ letterSpacing: 0.08 }}
              >
                {item.category}
              </Text>
            </View>
          </View>
          <Text className="textSecondary font-sans mb-4">
            {item.description}
          </Text>
          <Text
            className="textPrimary font-mono text-lg"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {item.hours.toFixed(1)} hours
          </Text>
          {item.category === 'OVERTIME' && item.cost && (
            <Text
              className="text-gold font-mono text-lg mt-2"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              ${item.cost.toFixed(2)}
            </Text>
          )}
          <View className="flex-row justify-between mt-4">
            <AnimatedPressable
              onPress={onApprove}
              className="px-4 py-2 bg-success rounded-lg"
            >
              <Text className="textPrimary font-sans-bold">Approve</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={onReject}
              className="px-4 py-2 bg-destructive rounded-lg"
            >
              <Text className="textPrimary font-sans-bold">Reject</Text>
            </AnimatedPressable>
          </View>
        </GlassCard>
      </GestureDetector>
    </View>
  );
};

export default ApprovalCard;
```
This implementation follows the design and technical specifications, ensuring that the swipe interactions reveal colors only in uncovered areas behind the card. The card's dark glass surface remains consistent, and interactions are handled using the appropriate libraries and techniques.
