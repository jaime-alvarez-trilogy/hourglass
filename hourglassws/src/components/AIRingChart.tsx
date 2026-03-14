/**
 * AIRingChart — Skia animated concentric ring chart (FR4)
 *
 * Renders 1 or 2 concentric arc rings, Oura-style:
 *   - Outer ring: AI usage % (0–100) — colors.cyan on colors.border track
 *   - Inner ring (optional): BrainLift % of 5h target — colors.violet on colors.border track
 *
 * Inner text (percentage label) is NOT rendered here — the parent component
 * positions a MetricValue absolutely over the ring's center hole.
 *
 * Usage:
 *   <View style={{ position: 'relative', width: size, height: size }}>
 *     <AIRingChart aiPercent={aiPercent} brainliftPercent={blPercent} size={size} />
 *     <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
 *       <MetricValue value={aiPercent} suffix="%" />
 *     </View>
 *   </View>
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, Path } from '@shopify/react-native-skia';
import { useSharedValue, withTiming, useDerivedValue } from 'react-native-reanimated';
import { colors } from '@/src/lib/colors';
import { timingChartFill } from '@/src/lib/reanimated-presets';

export interface AIRingChartProps {
  /** AI usage percentage, 0–100. Clamped to [0, 100]. */
  aiPercent: number;
  /** BrainLift hours as % of 5h target, 0–100 (optional — adds inner ring). */
  brainliftPercent?: number;
  /** Outer diameter in pixels (width = height = size). */
  size: number;
  /** Ring stroke thickness. Default: 12 */
  strokeWidth?: number;
}

/** Build an SVG arc path string for a ring segment */
function buildArcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  sweepAngle: number,
): string {
  if (sweepAngle <= 0) return '';

  // Clamp to just under 360° to avoid degenerate full-circle arc
  const sweep = Math.min(sweepAngle, 359.999 * (Math.PI / 180));

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(startAngle + sweep);
  const y2 = cy + radius * Math.sin(startAngle + sweep);
  const largeArc = sweep > Math.PI ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/** Build a full circle path for the track ring */
function buildFullCirclePath(cx: number, cy: number, radius: number): string {
  // Two half-arcs to form a full circle (a single arc to itself is degenerate)
  const top = cy - radius;
  const bottom = cy + radius;
  return (
    `M ${cx} ${top} ` +
    `A ${radius} ${radius} 0 1 1 ${cx} ${bottom} ` +
    `A ${radius} ${radius} 0 1 1 ${cx} ${top}`
  );
}

interface RingProps {
  cx: number;
  cy: number;
  radius: number;
  percent: number;
  fillColor: string;
  trackColor: string;
  strokeWidth: number;
  animDelay?: number;
}

function Ring({ cx, cy, radius, percent, fillColor, trackColor, strokeWidth, animDelay = 0 }: RingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const targetSweep = (clamped / 100) * (2 * Math.PI);

  const animatedSweep = useSharedValue(0);

  useEffect(() => {
    animatedSweep.value = withTiming(targetSweep, {
      ...timingChartFill,
      duration: timingChartFill.duration + animDelay,
    });
  }, [targetSweep]);

  const START_ANGLE = -Math.PI / 2; // 12 o'clock

  const trackPath = buildFullCirclePath(cx, cy, radius);

  const fillPath = useDerivedValue(() => {
    return buildArcPath(cx, cy, radius, START_ANGLE, animatedSweep.value);
  });

  return (
    <>
      <Path
        path={trackPath}
        color={trackColor}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
      />
      {clamped > 0 && (
        <Path
          path={fillPath}
          color={fillColor}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        />
      )}
    </>
  );
}

export default function AIRingChart({
  aiPercent,
  brainliftPercent,
  size,
  strokeWidth = 12,
}: AIRingChartProps) {
  const cx = size / 2;
  const cy = size / 2;

  // Outer ring: AI%
  const outerRadius = size / 2 - strokeWidth / 2;

  // Inner ring: BrainLift% (only when prop provided)
  const innerRadius = size / 2 - strokeWidth * 2.5;

  const hasBrainlift = brainliftPercent !== undefined && brainliftPercent !== null;

  return (
    <View style={{ position: 'relative', width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Ring
          cx={cx}
          cy={cy}
          radius={outerRadius}
          percent={aiPercent}
          fillColor={colors.cyan}
          trackColor={colors.border}
          strokeWidth={strokeWidth}
        />
        {hasBrainlift && (
          <Ring
            cx={cx}
            cy={cy}
            radius={innerRadius}
            percent={brainliftPercent!}
            fillColor={colors.violet}
            trackColor={colors.border}
            strokeWidth={strokeWidth}
            animDelay={100}
          />
        )}
      </Canvas>
    </View>
  );
}
