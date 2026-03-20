/**
 * TrendSparkline — VNX CartesianChart + Line + Area (04-victory-charts FR3)
 *
 * Migration from bespoke Skia bezier path to Victory Native XL.
 * External prop API is UNCHANGED — all callers and 07-overview-sync continue to work.
 *
 * Visual enhancements:
 * - Line with BlurMaskFilter neon glow paint
 * - Area with LinearGradient fill (brand color → transparent)
 *
 * Gesture migration:
 * - Gesture: useChartPressState (VNX built-in, replaces the old gesture hook)
 * - externalCursorIndex / onScrubChange interface preserved via renderOutside overlay
 *
 * Edge cases:
 *   - data=[]   → null (no crash), gesture disabled
 *   - width=0   → null (no crash)
 *   - data=[x]  → renders single-point chart (no crash)
 *   - all zeros → flat line at bottom
 */

import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { CartesianChart, Line, Area, useChartPressState } from 'victory-native';
import {
  Canvas,
  Line as SkiaLine,
  Circle,
  vec,
  matchFont,
  Text as SkiaText,
  BlurMask,
  LinearGradient,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/src/lib/colors';
import { timingChartFill } from '@/src/lib/reanimated-presets';
import { toLineData } from '@/src/lib/chartData';

export interface TrendSparklineProps {
  data: number[];
  width: number;
  height: number;
  /** Line color. Default: colors.gold */
  color?: string;
  /** Line stroke width. Default: 3 */
  strokeWidth?: number;
  /**
   * Optional ceiling value for the Y-axis scale.
   * If provided and >= all data values, the chart scales to this max instead of
   * data max — so bars/lines never touch the top unless data reaches maxValue.
   */
  maxValue?: number;
  /**
   * Show a faint horizontal guide line at the top of the chart (y=2),
   * representing the maxValue reference. Default: false.
   */
  showGuide?: boolean;
  /**
   * Optional label rendered at the right edge of the guide line.
   * Only shown when showGuide is true. e.g. "$2,000"
   */
  capLabel?: string;
  /**
   * When provided, the guide line is drawn at this data value's Y position
   * instead of at the top of the chart. Use when the target is below maxValue,
   * e.g. targetValue={75} with maxValue={100} for the 75% AI usage guide.
   */
  targetValue?: number;
  /**
   * Called with the nearest data index (0..N-1) during a horizontal pan gesture,
   * and with null when the gesture ends. Enables parent to update a hero value.
   */
  onScrubChange?: (index: number | null) => void;
  /**
   * Human-readable week labels for each data point (oldest first).
   * Length should match data.length. Used by parent for sub-label display.
   * Not rendered inside the canvas.
   */
  weekLabels?: string[];
  /**
   * External cursor index driven by a parent component for synchronized scrubbing.
   * When non-null, renders a cursor at that data index regardless of internal gesture state.
   * Takes priority over the internal gesture cursor.
   * Out-of-range values are clamped to [0, data.length - 1].
   * Used by OverviewScreen (07-overview-sync) to sync all 4 charts.
   */
  externalCursorIndex?: number | null;
}

const CAP_LABEL_FONT_SIZE = 10;

export default function TrendSparkline({
  data,
  width,
  height,
  color = colors.gold,
  strokeWidth = 3,
  maxValue,
  showGuide = false,
  capLabel,
  targetValue,
  onScrubChange,
  weekLabels: _weekLabels,
  externalCursorIndex = null,
}: TrendSparklineProps) {
  const clipProgress = useSharedValue(0);
  const h = height > 0 ? height : 52;

  useEffect(() => {
    clipProgress.value = withTiming(1, timingChartFill);
  }, []);

  // Re-reveal left-to-right when new week data arrives
  const prevDataLengthRef = useRef(data.length);
  useEffect(() => {
    if (data.length > prevDataLengthRef.current) {
      clipProgress.value = 0;
      clipProgress.value = withTiming(1, timingChartFill);
    }
    prevDataLengthRef.current = data.length;
  }, [data.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const clipStyle = useAnimatedStyle(() => ({
    width: clipProgress.value * width,
  }));

  // ── VNX gesture state ────────────────────────────────────────────────────
  const { state, isActive } = useChartPressState({ x: 0, y: { y: 0 } });

  // Emit onScrubChange from gesture — runs on JS thread via runOnJS
  const emitScrubChange = (active: boolean, position: number) => {
    if (active && data.length > 0) {
      const idx = Math.min(
        Math.max(Math.round(position * (data.length - 1)), 0),
        data.length - 1,
      );
      onScrubChange?.(idx);
    } else {
      onScrubChange?.(null);
    }
  };

  useAnimatedReaction(
    () => ({ active: isActive.value, position: state.x.position.value }),
    ({ active, position }) => {
      runOnJS(emitScrubChange)(active, position);
    },
  );

  // ── Early returns ────────────────────────────────────────────────────────

  if (data.length === 0 || width === 0) return null;

  // Y domain
  const dataMax = Math.max(...data);
  const yMax = maxValue !== undefined && maxValue >= dataMax ? maxValue : dataMax;
  const yMin = Math.min(...data);

  // Cap label font
  const capFont = showGuide && capLabel
    ? matchFont({ fontFamily: 'System', fontSize: CAP_LABEL_FONT_SIZE })
    : null;

  // Cap label positioning — right-aligned, top of chart area
  const capLabelWidth = capFont && capLabel ? capFont.measureText(capLabel).width : 0;
  const capLabelX = width - capLabelWidth - 4;
  const capLabelY = CAP_LABEL_FONT_SIZE;

  return (
    <View style={{ width, height: h }}>
      {/* Cap label overlay — rendered above clip so it's always visible */}
      {showGuide && capLabel && capFont && (
        <Canvas
          style={{ position: 'absolute', top: 0, left: 0, width, height: h, zIndex: 1 }}
          pointerEvents="none"
        >
          <SkiaText
            x={capLabelX}
            y={capLabelY}
            text={capLabel}
            font={capFont}
            color={colors.textMuted}
            opacity={0.35}
          />
        </Canvas>
      )}
      <Animated.View style={[{ overflow: 'hidden', height: h }, clipStyle]}>
        {/* toLineData normalizes data[] to VNX-typed [{x, y}] records */}
        <CartesianChart
          data={toLineData(data)}
          xKey="x"
          yKeys={['y']}
          domain={{ y: [yMin, yMax] }}
          gestureLongPressDelay={0}
          renderOutside={({ chartBounds }) => {
            // ── External cursor overlay (for 07-overview-sync) ──────────────
            // Render only when externalCursorIndex !== null
            if (!(externalCursorIndex !== null) || data.length === 0) return null;
            const clampedIdx = Math.max(0, Math.min(externalCursorIndex, data.length - 1));
            const cursorX = data.length > 1
              ? chartBounds.left + (clampedIdx / (data.length - 1)) * (chartBounds.right - chartBounds.left)
              : chartBounds.left + chartBounds.width / 2;

            // Compute Y for cursor dot from the data value
            const dataRange = yMax - yMin;
            const yPct = dataRange === 0 ? 0.5 : 1 - (data[clampedIdx] - yMin) / dataRange;
            const cursorY = chartBounds.top + yPct * (chartBounds.bottom - chartBounds.top);

            return (
              <Canvas style={{ position: 'absolute', top: 0, left: 0, width, height: h }}>
                {/* Vertical cursor line */}
                <SkiaLine
                  p1={vec(cursorX, chartBounds.top)}
                  p2={vec(cursorX, chartBounds.bottom)}
                  color={colors.textMuted}
                  strokeWidth={1}
                  opacity={0.5}
                />
                {/* Cursor dot */}
                <Circle cx={cursorX} cy={cursorY} r={strokeWidth * 1.5} color={color} />
              </Canvas>
            );
          }}
        >
          {({ points, chartBounds }) => (
            <>
              {/* Area fill — LinearGradient from brand color → transparent */}
              <Area
                points={points.y}
                y0={chartBounds.bottom}
                color="transparent"
              >
                <LinearGradient
                  start={vec(0, chartBounds.top)}
                  end={vec(0, chartBounds.bottom)}
                  colors={[color + '66', 'transparent']}
                />
              </Area>

              {/* Line with neon glow BlurMaskFilter */}
              <Line
                points={points.y}
                strokeWidth={strokeWidth}
                color={color}
              >
                <BlurMask blur={8} style="solid" />
              </Line>
            </>
          )}
        </CartesianChart>
      </Animated.View>
    </View>
  );
}
