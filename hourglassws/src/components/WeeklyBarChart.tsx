/**
 * WeeklyBarChart — Skia animated bar chart (FR2)
 *
 * Renders Mon–Sun bars on a Skia canvas. Each bar animates from 0 to its
 * target height using timingChartFill with a left-to-right stagger (withDelay).
 *
 * Bar colors:
 *   - Past completed day → colors.success
 *   - Today              → colors.gold
 *   - Future day         → colors.textMuted
 *
 * Parent must provide width/height from onLayout:
 *   const [dims, setDims] = useState({ width: 0, height: 0 });
 *   <View onLayout={e => setDims(e.nativeEvent.layout)}>
 *     <WeeklyBarChart data={daily} width={dims.width} height={dims.height} />
 *   </View>
 */

import React, { useEffect } from 'react';
import { Canvas, Rect, useDerivedValue } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '@/src/lib/colors';
import { timingChartFill } from '@/src/lib/reanimated-presets';

export interface DailyHours {
  day: string;       // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  hours: number;
  isToday?: boolean;
  isFuture?: boolean;
}

export interface WeeklyBarChartProps {
  data: DailyHours[];
  /** Y-axis max. Default: Math.max(8, max(data.hours)) */
  maxHours?: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Sub-component: a single animated bar
// ---------------------------------------------------------------------------

interface BarProps {
  x: number;
  barWidth: number;
  targetHeight: number;
  canvasHeight: number;
  color: string;
  index: number;
}

function AnimatedBar({ x, barWidth, targetHeight, canvasHeight, color, index }: BarProps) {
  const animatedH = useSharedValue(0);

  useEffect(() => {
    animatedH.value = withDelay(
      Math.min(index * 50, 300),
      withTiming(targetHeight, timingChartFill),
    );
  }, [targetHeight, index]);

  // Bridge Reanimated → Skia via useDerivedValue
  const skiaH = useDerivedValue(() => animatedH.value);
  const skiaY = useDerivedValue(() => canvasHeight - animatedH.value);

  return (
    <Rect
      x={x}
      y={skiaY}
      width={barWidth}
      height={skiaH}
      color={color}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WeeklyBarChart({
  data,
  maxHours,
  width,
  height,
}: WeeklyBarChartProps) {
  if (data.length === 0 || width === 0 || height === 0) {
    return <Canvas style={{ width, height }} />;
  }

  const resolvedMax =
    maxHours ?? Math.max(8, ...data.map(d => d.hours));

  // Layout geometry — even spacing across canvas width
  const barCount = data.length;
  const GAP_FRACTION = 0.3; // 30% of slot is gap
  const slotWidth = width / barCount;
  const barWidth = slotWidth * (1 - GAP_FRACTION);
  const barOffset = slotWidth * (GAP_FRACTION / 2);

  return (
    <Canvas style={{ width, height }}>
      {data.map((entry, index) => {
        const targetHeight =
          resolvedMax > 0
            ? Math.max(2, (entry.hours / resolvedMax) * height)
            : 2;

        const barColor = entry.isToday
          ? colors.gold
          : entry.isFuture
          ? colors.textMuted
          : colors.success;

        const x = index * slotWidth + barOffset;

        return (
          <AnimatedBar
            key={entry.day + index}
            x={x}
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
