/**
 * WeeklyBarChart — VNX CartesianChart + Bar (04-victory-charts FR2)
 *
 * Migration from bespoke Skia Rect bars to Victory Native XL.
 * External prop API is UNCHANGED — all callers continue to work without modification.
 *
 * Visual enhancements:
 * - Vertical LinearGradient fill: peak color at top → transparent at base
 * - Rounded top corners (4px radius)
 * - Entry animation: Animated.View clip reveals chart left-to-right on mount
 *   (same clipProgress / timingChartFill pattern as before — zero JS per frame)
 *
 * Overtime coloring and watermark label are preserved exactly.
 */

import React, { useEffect } from 'react';
import { CartesianChart, Bar } from 'victory-native';
import {
  Canvas,
  Text as SkiaText,
  LinearGradient,
  matchFont,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '@/src/lib/colors';
import { timingChartFill } from '@/src/lib/reanimated-presets';
import { toBarData } from '@/src/lib/chartData';

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
  /** When provided, bars whose running cumulative total exceeds this value shift to OVERTIME_WHITE_GOLD */
  weeklyLimit?: number;
  /**
   * Hex colour for today's in-progress bar.
   * Should reflect the current panel state (success/warning/critical/overtimeWhiteGold/textMuted).
   * Default: colors.success (on-track green).
   */
  todayColor?: string;
  /**
   * Optional large watermark text rendered at chart center (e.g. "38.5h").
   * Rendered at very low opacity for a ghost/texture effect.
   */
  watermarkLabel?: string;
}

/** Warm white-gold used for bars that push the running total beyond weeklyLimit */
const OVERTIME_WHITE_GOLD = '#FFF8E7';
const WATERMARK_FONT_SIZE = 52;

export default function WeeklyBarChart({
  data,
  maxHours,
  width,
  height,
  weeklyLimit,
  todayColor = colors.success,
  watermarkLabel,
}: WeeklyBarChartProps) {
  const clipProgress = useSharedValue(0);

  useEffect(() => {
    clipProgress.value = withTiming(1, timingChartFill);
  }, []);

  const clipStyle = useAnimatedStyle(() => ({
    width: clipProgress.value * width,
  }));

  if (data.length === 0 || width === 0) return null;

  const h = height > 0 ? height : 120;

  // Max Y domain
  const resolvedMax = maxHours ?? Math.max(8, ...data.map((d) => d.hours));

  // ── Compute per-bar colors (overtime logic requires running cumulative total) ──
  let runningTotal = 0;
  const derivedColors: string[] = data.map((entry) => {
    if (entry.isFuture) {
      return colors.textMuted;
    }
    runningTotal += entry.hours;
    if (weeklyLimit !== undefined && runningTotal > weeklyLimit) {
      return OVERTIME_WHITE_GOLD;
    }
    if (entry.isToday) {
      return todayColor;
    }
    return colors.success;
  });

  const todayIndex = data.findIndex((d) => d.isToday);
  const rawValues = data.map((d) => d.hours);

  // Watermark font — only loaded when needed
  const watermarkFont =
    watermarkLabel ? matchFont({ fontFamily: 'System', fontSize: WATERMARK_FONT_SIZE }) : null;

  const watermarkTextW =
    watermarkFont && watermarkLabel ? watermarkFont.measureText(watermarkLabel).width : 0;
  const watermarkX = width / 2 - watermarkTextW / 2;
  const watermarkY = h / 2 + WATERMARK_FONT_SIZE / 3;

  return (
    <Animated.View style={[{ overflow: 'hidden', height: h }, clipStyle]}>
      {/* Watermark canvas — rendered behind the bar chart */}
      {watermarkLabel && watermarkFont && (
        <Canvas
          style={{ position: 'absolute', top: 0, left: 0, width, height: h, zIndex: 0 }}
        >
          <SkiaText
            x={watermarkX}
            y={watermarkY}
            text={watermarkLabel}
            font={watermarkFont}
            color={colors.textPrimary}
            opacity={0.07}
          />
        </Canvas>
      )}

      {/* toBarData normalizes data[] to VNX-typed BarDatum records */}
      {/* Overtime colors are merged in after toBarData runs */}
      {(() => {
        const chartData = toBarData(rawValues, todayIndex, todayColor).map((d, i) => ({
          ...d,
          color: derivedColors[i],
        }));
        return (
          <CartesianChart
            data={chartData}
            xKey="day"
            yKeys={['value']}
            domain={{ y: [0, resolvedMax] }}
          >
            {({ points, chartBounds }) => (
              <>
                {chartData.map((datum) => (
                  <Bar
                    key={datum.day}
                    points={points.value}
                    chartBounds={chartBounds}
                    roundedCorners={{ topLeft: 4, topRight: 4 }}
                  >
                    <LinearGradient
                      start={vec(0, 0)}
                      end={vec(0, h)}
                      colors={[datum.color, 'transparent']}
                    />
                  </Bar>
                ))}
              </>
            )}
          </CartesianChart>
        );
      })()}
    </Animated.View>
  );
}
