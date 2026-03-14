/**
 * WeeklyBarChart — Skia bar chart (FR2)
 *
 * Static render for Skia 2.2.12 compatibility — no state, no animation inside Canvas.
 * Each slot always renders a faint full-height track bar so the chart is visible even
 * when hours are zero. Actual-hours bar overlays the track bar.
 */

import React from 'react';
import { Canvas, Rect, Line, vec } from '@shopify/react-native-skia';
import { colors } from '@/src/lib/colors';

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

// Track bar alpha — visible enough to show the chart structure, subtle enough
// that real data bars stand out.
const TRACK_COLOR = colors.border; // #2A2A3D

export default function WeeklyBarChart({ data, maxHours, width, height }: WeeklyBarChartProps) {
  // Need width to render; height can fall back to a safe default
  if (data.length === 0 || width === 0) return null;

  const h = height > 0 ? height : 120;

  const resolvedMax = maxHours ?? Math.max(8, ...data.map(d => d.hours));
  const GAP_FRACTION = 0.3;
  const slotWidth = width / data.length;
  const barWidth = slotWidth * (1 - GAP_FRACTION);
  const barOffset = slotWidth * (GAP_FRACTION / 2);

  // Faint guideline at max (top of chart)
  const guideY = 2;
  const chartHeight = h - 4; // usable height below guide

  return (
    <Canvas style={{ width, height: h }}>
      {/* Max hours guide line */}
      <Line
        p1={vec(0, guideY)}
        p2={vec(width, guideY)}
        color={TRACK_COLOR}
        strokeWidth={1}
      />

      {data.map((entry, index) => {
        const x = index * slotWidth + barOffset;

        // Track bar — always full chart height so the column is visible
        const trackY = guideY + 1;
        const trackHeight = h - trackY;

        // Data bar — proportional to hours
        const dataBarHeight = resolvedMax > 0
          ? Math.max(2, (entry.hours / resolvedMax) * chartHeight)
          : 0;
        const dataBarY = h - dataBarHeight;

        const barColor = entry.isToday
          ? colors.gold
          : entry.isFuture
            ? colors.textMuted
            : colors.success;

        return (
          <React.Fragment key={entry.day + index}>
            {/* Track (background) */}
            <Rect
              x={x}
              y={trackY}
              width={barWidth}
              height={trackHeight}
              color={TRACK_COLOR}
            />
            {/* Data (foreground) — only render when there are hours */}
            {entry.hours > 0 && (
              <Rect
                x={x}
                y={dataBarY}
                width={barWidth}
                height={dataBarHeight}
                color={barColor}
              />
            )}
          </React.Fragment>
        );
      })}
    </Canvas>
  );
}
