```tsx
import React from 'react';
import { View, Text, Dimensions, Image } from 'react-native';
import { styled } from 'nativewind';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Canvas,
  RoundedRect,
  BackdropFilter,
  LinearGradient as SkiaLinearGradient,
  vec,
} from '@shopify/react-native-skia';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check, X } from 'lucide-react-native';
import { springBouncy, springSnappy, timingInstant } from '../lib/reanimated-presets'; // Assuming path

// --- TYPE DEFINITIONS ---

export interface ApprovalItem {
  approvalId: string;
  fullName: string;
  hours: number;
  description: string;
  category: 'MANUAL' | 'OVERTIME';
}

export interface OvertimeApprovalItem extends ApprovalItem {
  category: 'OVERTIME';
  cost: number;
}

interface ApprovalCardProps {
  item: ApprovalItem | OvertimeApprovalItem;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
}

// --- STYLED COMPONENTS (for NativeWind) ---

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledAnimatedView = styled(Animated.View);
const StyledImage = styled(Image);

// --- CONSTANTS ---

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; // 30% of screen width to trigger action
const BORDER_RADIUS = 16; // rounded-2xl

// Base64 encoded 50x50 white noise PNG for the noise overlay
const NOISE_TEXTURE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAMqADAAQAAAABAAAAMgAAAADSPQyJAAABc0lEQVR4Ae3aPUtCYRTA8d+7eA8aQlPq0KAuCg7t0JvBoZtQp05dRN/A4uLgJpQQXCqITUErQv0BhxYdBEUhjVb4zhd8E2dGBxX+wIOXHO+5f+55LgghhBBCCCGEEEKIYxRj9SgO4yBOM4qxCmM4g1s4g2c4i3M4h9u4g39YxRNYxR+s4wG2sY/N7DA+xWj2sY9v2MENvOEpvMIfvOEN3uEVvOEN/uIDnCgcpHic4BRecIUP+MIPfOEL/uAH/uIF/uEVp3GeVnCK1nCGBziNn3jEaFxjE5/YxCdusYktbGEbm9jEZrawhW1sYx+f2Mcn9vCFPWxhF3vYwT52sY9d7GEPO9jFXvaxh13sYQ872Mde9rCPLexiH3vYwV52sY9t7GA3e9jDHvaxjZ1sYxfb2MEWdrGLTWO72dgiVnGJtaxhE1vYxTau8B92sYt9bOIPn+A+hBBCCCGEEEIIIYQ4j/wB5Xl3sYl+140AAAAASUVORK5CYII=';

// --- HELPER COMPONENT: AnimatedPressable ---
// As required, this handles the standard button press animation.

interface AnimatedPressableProps extends React.ComponentProps<typeof StyledView> {
  onPress: () => void;
  children: React.ReactNode;
}

const AnimatedPressable = ({ children, onPress, ...props }: AnimatedPressableProps) => {
  const scale = useSharedValue(1);

  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withTiming(0.96, timingInstant);
    })
    .onEnd(() => {
      runOnJS(onPress)();
    })
    .onFinalize(() => {
      scale.value = withTiming(1, timingInstant);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <StyledAnimatedView style={animatedStyle} {...props}>
        {children}
      </StyledAnimatedView>
    </GestureDetector>
  );
};

// --- MAIN COMPONENT: ApprovalCard ---

const ApprovalCard = ({ item, onApprove, onReject }: ApprovalCardProps) => {
  const translateX = useSharedValue(0);
  const isOvertime = item.category === 'OVERTIME';

  const handleApprove = () => {
    onApprove(item.approvalId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReject = () => {
    onReject(item.approvalId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_WIDTH, springSnappy, () => {
          runOnJS(handleApprove)();
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH, springSnappy, () => {
          runOnJS(handleReject)();
        });
      } else {
        translateX.value = withSpring(0, springBouncy);
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionIndicatorStyle = (isRightSide: boolean) => useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      isRightSide ? [0, SWIPE_THRESHOLD] : [-SWIPE_THRESHOLD, 0],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const cardBorderGradient = useAnimatedStyle(() => {
    const isApproving = translateX.value > 10;
    const isRejecting = translateX.value < -10;

    if (isApproving) return { borderColor: '#10B981' }; // success
    if (isRejecting) return { borderColor: '#F85149' }; // destructive
    return { borderColor: '#A78BFA' }; // violet
  });
  
  const CardBorder = () => (
    <Animated.View style={[{
        borderColor: '#A78BFA', // violet
        borderWidth: 1.5,
        borderRadius: BORDER_RADIUS,
    }, StyleSheet.absoluteFill, cardBorderGradient]} />
  );

  return (
    <StyledView className="w-full relative justify-center" style={{ height: 180 }}>
      {/* --- Swipe-Reveal Background Actions --- */}
      <StyledView className="absolute left-0 right-0 h-full flex-row justify-between items-center rounded-2xl">
        {/* Reject Indicator (Left) */}
        <StyledView className="bg-destructive/20 h-full w-1/2 justify-center items-start pl-6">
           <StyledAnimatedView style={actionIndicatorStyle(false)}>
              <X size={32} color="#F85149" />
           </StyledAnimatedView>
        </StyledView>
        {/* Approve Indicator (Right) */}
        <StyledView className="bg-success/20 h-full w-1/2 justify-center items-end pr-6">
           <StyledAnimatedView style={actionIndicatorStyle(true)}>
              <Check size={32} color="#10B981" />
           </StyledAnimatedView>
        </StyledView>
      </StyledView>

      <GestureDetector gesture={panGesture}>
        <StyledAnimatedView style={cardAnimatedStyle} className="absolute w-full">
          {/* --- Liquid Glass Card Implementation --- */}
          <StyledView>
            <MaskedView
              style={{ width: '100%', height: '100%' }}
              maskElement={
                <StyledView className="bg-transparent rounded-2xl border-white border-[1.5px] w-full h-full" />
              }
            >
              <Animated.View style={[{width: '100%', height: '100%'}, cardBorderGradient]}>
                <LinearGradient
                  colors={['#A78BFA', 'transparent']} // violet -> transparent
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: '100%', height: '100%' }}
                />
              </Animated.View>
            </MaskedView>

            <StyledView className="absolute inset-0 rounded-2xl overflow-hidden">
              {/* 4. Skia Canvas for Glass Effect */}
              <Canvas style={{ flex: 1 }} renderToHardwareTextureAndroid={true}>
                <RoundedRect x={0} y={0} width={SCREEN_WIDTH - 32} height={180} r={BORDER_RADIUS} color="rgba(22,21,31,0.6)">
                  <BackdropFilter blur={16} clip={{ x: 0, y: 0, width: SCREEN_WIDTH - 32, height: 180, r: BORDER_RADIUS }} />
                </RoundedRect>
              </Canvas>

              {/* 5. Noise Overlay */}
              <StyledImage
                source={{ uri: NOISE_TEXTURE_BASE64 }}
                className="absolute inset-0 w-full h-full"
                style={{ opacity: 0.03, tintColor: '#FFFFFF', resizeMode: 'repeat' }}
              />

              {/* 6. Inner Shadows */}
              <StyledView className="absolute top-0 left-0 right-0 h-1/2">
                <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={{ flex: 1 }} />
              </StyledView>
              <StyledView className="absolute bottom-0 left-0 right-0 h-[1.5px]">
                <LinearGradient colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.0)']} start={{x: 0.2, y: 0}} end={{x: 0.8, y:0}} style={{ flex: 1 }} />
              </StyledView>

              {/* 7. Content View */}
              <StyledView className="absolute inset-0 p-5 flex-col justify-between">
                {/* --- Card Header --- */}
                <StyledView className="flex-row justify-between items-start">
                  <StyledView
                    className={`py-1 px-3 rounded-full ${isOvertime ? 'bg-warning' : 'bg-violet'}`}
                  >
                    <StyledText
                      className={`font-sans-semibold text-xs uppercase tracking-wider ${isOvertime ? 'text-background' : 'text-textPrimary'}`}
                    >
                      {item.category}
                    </StyledText>
                  </StyledView>
                  <StyledView className="items-end">
                    <StyledText className="font-mono text-3xl text-textPrimary" style={{ fontVariant: ['tabular-nums'] }}>
                      {item.hours.toFixed(2)}
                    </StyledText>
                    <StyledText className="font-sans-medium text-xs text-textMuted uppercase tracking-widest -mt-1">
                      HOURS
                    </StyledText>
                  </StyledView>
                </StyledView>

                {/* --- Card Body --- */}
                <StyledView className="flex-grow justify-center -mt-4">
                  <StyledText className="font-sans-semibold text-lg text-textPrimary" numberOfLines={1}>
                    {item.fullName}
                  </StyledText>
                  <StyledText className="font-sans text-sm text-textSecondary mt-1" numberOfLines={2}>
                    {item.description}
                  </StyledText>
                  {isOvertime && (item as OvertimeApprovalItem).cost && (
                     <StyledText className="font-mono text-base text-gold mt-2" style={{ fontVariant: ['tabular-nums'] }}>
                       ${(item as OvertimeApprovalItem).cost.toFixed(2)}
                     </StyledText>
                  )}
                </StyledView>

                 {/* --- Accessibility Actions --- */}
                <StyledView className="flex-row gap-x-3">
                  <AnimatedPressable
                    onPress={handleReject}
                    className="flex-1 bg-destructive/20 active:bg-destructive/40 h-10 rounded-lg items-center justify-center"
                  >
                    <StyledText className="font-sans-semibold text-destructive">Reject</StyledText>
                  </AnimatedPressable>
                  <AnimatedPressable
                    onPress={handleApprove}
                    className="flex-1 bg-success/20 active:bg-success/40 h-10 rounded-lg items-center justify-center"
                  >
                    <StyledText className="font-sans-semibold text-success">Approve</StyledText>
                  </AnimatedPressable>
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledAnimatedView>
      </GestureDetector>
    </StyledView>
  );
};

export default ApprovalCard;
```
