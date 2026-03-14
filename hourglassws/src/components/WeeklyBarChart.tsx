/**
 * WeeklyBarChart — Skia animated bar chart (FR2)
 *
 * Animation pattern for Skia 2.2.12 + Reanimated 4 + New Architecture:
 *   useSharedValue + withTiming drives the animation on the UI thread.
 *   useAnimatedReaction + runOnJS bridges the animated value to React state.
 *   Skia Canvas re-renders with updated static values each frame.
 *
 * This avoids passing SharedValue/DerivedValue directly as Skia props,
 * which is unreliable in Skia < 2.3 and on Fabric.
 */

import React, { useEffect, useState } from 'react';
import { Canvas, Rect } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  withDelay,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/src/lib/colors';
import { timingChartFill } from '@/src/lib/reanimated-presets';

export interface DailyHours {
  day: string;
  hours: number;
  isToday?: boolean;
  isFuture?: boolean;
}

export interface WeeklyBarChartProps {
  data: DailyHours[];
  maxHours?: number;
  width: number;
  height: number;
}

interface BarProps {
  x: number;
  barWidth: number;
  targetHeight: number;
  canvasHeight: number;
  color: string;
  index: number;
}

function AnimatedBar({ x, barWidth, targetHeight, canvasHeight, color, index }: BarProps) {
  const [barH, setBarH] = useState(0);
  const animatedH = useSharedValue(0);

  useEffect(() => {
    animatedH.value = withDelay(
      Math.min(index * 50, 300),
      withTiming(targetHeight, timingChartFill),
    );
  }, [targetHeight, index]);

  useAnimatedReaction(
    () => animatedH.value,
    (v) => { runOnJS(setBarH)(v); },
  );

  return (
    <Rect
      x={x}
      y={canvasHeight - barH}
      width={barWidth}
      height={Math.max(0, barH)}
      color={color}
    />
  );
}

export default function WeeklyBarChart({ data, maxHours, width, height }: WeeklyBarChartProps) {
  if (data.length === 0 || width === 0 || height === 0) return null;

  const resolvedMax = maxHours ?? Math.max(8, ...data.map(d => d.hours));
  const GAP_FRACTION = 0.3;
  const slotWidth = width / data.length;
  const barWidth = slotWidth * (1 - GAP_FRACTION);
  const barOffset = slotWidth * (GAP_FRACTION / 2);

  return (
    <Canvas style={{ width, height }}>
      {data.map((entry, index) => {
        const targetHeight = resolvedMax > 0
          ? Math.max(2, (entry.hours / resolvedMax) * height)
          : 2;
        const barColor = entry.isToday ? colors.gold
          : entry.isFuture ? colors.textMuted
          : colors.success;

        return (
          <AnimatedBar
            key={entry.day + index}
            x={index * slotWidth + barOffset}
            barWidth={barWidth}
            targetHeight={targetHeight}
            canvasHeight={height}
            color={barColor}
            index={index}
          />
        );
      })}
    </Canvas>
  );
}
