// FR2: Welcome screen — splash + Get Started CTA
import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { springBouncy } from '@/src/lib/reanimated-presets';

export default function WelcomeScreen() {
  const router = useRouter();

  // Panel entrance: slide up from 40px + fade in
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, springBouncy);
    opacity.value = withSpring(1, springBouncy);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 justify-between py-8">
        {/* Hero panel — animated entrance */}
        <Animated.View style={animStyle} className="flex-1 items-center justify-center gap-4">
          <Text className="font-display-bold text-4xl text-textPrimary">Hourglass</Text>
          <Text className="font-body text-base text-textSecondary text-center">
            Crossover Time Tracker
          </Text>
        </Animated.View>

        {/* CTA */}
        <TouchableOpacity
          className="bg-gold rounded-xl py-4 px-8 items-center mb-4"
          onPress={() => router.push('/(auth)/credentials')}
          activeOpacity={0.85}
        >
          <Text className="font-sans-semibold text-base text-background">Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
