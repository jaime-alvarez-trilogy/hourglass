// FR4: iOS Widget Component (expo-widgets, SDK 55)
// Built with @expo/ui/swift-ui — compiles to SwiftUI at build time.
// Supports three sizes: systemSmall, systemMedium, systemLarge.
//
// Data is pre-populated via HourglassWidget.updateTimeline() in bridge.ts.
// This file is compiled by the expo-widgets build plugin — never bundled
// into the main app JS bundle.
//
// 01-widget-visual-ios:
//   FR2: Glass cards for Medium/Large hero row
//   FR3: Gradient background (two Rectangle layers) for all sizes
//   FR4: Bar chart (IosBarChart) for Large size

import type { WidgetData, WidgetDailyEntry } from '../types';

// SwiftUI component imports (expo-widgets JSX subset)
// These are resolved at build time by the expo-widgets plugin
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { VStack, HStack, ZStack, Text, Spacer, Rectangle, RoundedRectangle } = require('@expo/ui/swift-ui');

// ─── Urgency color mapping ─────────────────────────────────────────────────────

const PACE_LABELS: Record<string, string> = {
  crushed_it: 'CRUSHED IT',
  on_track:   'ON TRACK',
  behind:     'BEHIND PACE',
  critical:   'CRITICAL',
};

const URGENCY_ACCENT: Record<string, string> = {
  none: '#00FF88',
  low: '#F5C842',
  high: '#FF6B00',
  critical: '#FF2D55',
  expired: '#6B6B6B',
};

// FR3: gradient background tint colours (8-char hex = RRGGBBAA, ~12% opacity)
const URGENCY_TINTS: Record<string, string> = {
  none:     '#0D0C1433',  // near-transparent base tint
  low:      '#F5C84220',  // gold tint ~12%
  high:     '#FF6B0020',  // orange tint ~12%
  critical: '#FF2D5520',  // red tint ~12%
  expired:  '#6B6B6B20',  // grey tint ~12%
};

// FR2: glass card colours
const CARD_BG     = '#1F1E2C';
const CARD_BORDER = '#2F2E41';

// FR4: bar chart constants
const MAX_BAR_HEIGHT = 100;
const BAR_PAST  = '#4A4A6A';
const BAR_MUTED = '#2F2E41';

// ─── Stale indicator ──────────────────────────────────────────────────────────

function isStale(cachedAt: number): boolean {
  return Date.now() - cachedAt > 2 * 60 * 60 * 1000;
}

function formatCachedTime(cachedAt: number): string {
  const d = new Date(cachedAt);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ─── FR2: Glass card component ────────────────────────────────────────────────

function IosGlassCard({ children }: { children: React.ReactNode }) {
  return (
    <ZStack>
      <RoundedRectangle fill={CARD_BG} cornerRadius={12} stroke={CARD_BORDER} strokeWidth={1} />
      <VStack padding={10}>
        {children}
      </VStack>
    </ZStack>
  );
}

// ─── FR4: Bar chart component ─────────────────────────────────────────────────
// Exported for unit testing.

export function IosBarChart({ daily, accent }: { daily: WidgetDailyEntry[]; accent: string }) {
  const maxHours = Math.max(...daily.map((d) => d.hours), 0);

  return (
    <HStack spacing={4}>
      {daily.map((entry) => {
        const barHeight = maxHours > 0 ? (entry.hours / maxHours) * MAX_BAR_HEIGHT : 0;
        const barColor = entry.isToday
          ? accent
          : entry.isFuture || entry.hours === 0
            ? BAR_MUTED
            : BAR_PAST;

        return (
          <VStack spacing={2} key={entry.day}>
            <Spacer />
            <RoundedRectangle fill={barColor} cornerRadius={3} height={barHeight} />
            <Text font={{ size: 10 }} foregroundStyle="#777777">
              {entry.day}
            </Text>
          </VStack>
        );
      })}
    </HStack>
  );
}

// ─── Small widget ─────────────────────────────────────────────────────────────
// Shows: weekly hours total, pace badge, stale indicator

function SmallWidget({ props }: { props: WidgetData }) {
  const accent = URGENCY_ACCENT[props.urgency] ?? URGENCY_ACCENT.none;
  const tint   = URGENCY_TINTS[props.urgency]  ?? URGENCY_TINTS.none;

  return (
    <ZStack>
      {/* FR3: gradient background layers */}
      <Rectangle fill="#0D0C14" />
      <Rectangle fill={tint} />

      <VStack padding={12}>
        {/* Hours total */}
        <Text
          font={{ size: 28, weight: 'bold' }}
          foregroundStyle={accent}
        >
          {props.hoursDisplay}
        </Text>

        <Spacer />

        {/* Pace status */}
        {PACE_LABELS[props.paceBadge] && (
          <Text
            font={{ size: 12 }}
            foregroundStyle={accent}
          >
            {PACE_LABELS[props.paceBadge]}
          </Text>
        )}

        {/* Stale indicator */}
        {isStale(props.cachedAt) && (
          <Text font={{ size: 10 }} foregroundStyle="#FF9500">
            Cached: {formatCachedTime(props.cachedAt)}
          </Text>
        )}

        {/* Manager badge */}
        {props.isManager && props.pendingCount > 0 && (
          <Text font={{ size: 11 }} foregroundStyle="#FF3B30">
            {props.pendingCount} pending
          </Text>
        )}
      </VStack>
    </ZStack>
  );
}

// ─── Medium widget ─────────────────────────────────────────────────────────────
// Shows: glass card (hours) + glass card (earnings) + today's hours + AI%

function MediumWidget({ props }: { props: WidgetData }) {
  const accent = URGENCY_ACCENT[props.urgency] ?? URGENCY_ACCENT.none;
  const tint   = URGENCY_TINTS[props.urgency]  ?? URGENCY_TINTS.none;

  return (
    <ZStack>
      {/* FR3: gradient background layers */}
      <Rectangle fill="#0D0C14" />
      <Rectangle fill={tint} />

      <VStack padding={12}>
        {/* FR2: Top row — two glass cards side by side */}
        <HStack spacing={8}>
          <IosGlassCard>
            <Text font={{ size: 32, weight: 'bold' }} foregroundStyle={accent}>
              {props.hoursDisplay}
            </Text>
            <Text font={{ size: 12 }} foregroundStyle="#AAAAAA">
              this week
            </Text>
          </IosGlassCard>

          <IosGlassCard>
            <Text font={{ size: 24, weight: 'semibold' }} foregroundStyle="#FFFFFF">
              {props.earnings}
            </Text>
            <Text font={{ size: 12 }} foregroundStyle="#AAAAAA">
              earned
            </Text>
          </IosGlassCard>
        </HStack>

        <Spacer />

        {/* Bottom row: today + AI% */}
        <HStack>
          <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
            Today: {props.today}
          </Text>
          <Spacer />
          <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
            AI: {props.aiPct}
          </Text>
        </HStack>

        {/* Hours remaining */}
        <Text font={{ size: 12 }} foregroundStyle="#AAAAAA">
          {props.hoursRemaining}
        </Text>

        {/* Stale indicator */}
        {isStale(props.cachedAt) && (
          <Text font={{ size: 10 }} foregroundStyle="#FF9500">
            Cached: {formatCachedTime(props.cachedAt)}
          </Text>
        )}

        {/* Manager badge */}
        {props.isManager && props.pendingCount > 0 && (
          <Text font={{ size: 11 }} foregroundStyle="#FF3B30">
            {props.pendingCount} pending approval
          </Text>
        )}
      </VStack>
    </ZStack>
  );
}

// ─── Large widget ──────────────────────────────────────────────────────────────
// Shows: glass card hero row + bar chart + detail rows

function LargeWidget({ props }: { props: WidgetData }) {
  const accent = URGENCY_ACCENT[props.urgency] ?? URGENCY_ACCENT.none;
  const tint   = URGENCY_TINTS[props.urgency]  ?? URGENCY_TINTS.none;

  return (
    <ZStack>
      {/* FR3: gradient background layers */}
      <Rectangle fill="#0D0C14" />
      <Rectangle fill={tint} />

      <VStack padding={16}>
        {/* FR2: Hero row — two glass cards */}
        <HStack spacing={8}>
          <IosGlassCard>
            <Text font={{ size: 36, weight: 'bold' }} foregroundStyle={accent}>
              {props.hoursDisplay}
            </Text>
            <Text font={{ size: 12 }} foregroundStyle="#AAAAAA">
              this week
            </Text>
          </IosGlassCard>

          <IosGlassCard>
            <Text font={{ size: 26, weight: 'semibold' }} foregroundStyle="#FFFFFF">
              {props.earnings}
            </Text>
            <Text font={{ size: 12 }} foregroundStyle="#AAAAAA">
              earned
            </Text>
          </IosGlassCard>
        </HStack>

        {/* FR4: Daily bar chart */}
        {props.daily && props.daily.length > 0 && (
          <IosBarChart daily={props.daily} accent={accent} />
        )}

        <Spacer />

        {/* Today + delta vs daily average */}
        <HStack>
          <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
            Today: {props.today}
          </Text>
          <Spacer />
          {props.todayDelta && (
            <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
              {props.todayDelta}
            </Text>
          )}
        </HStack>

        {/* AI% */}
        <HStack>
          <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
            AI usage: {props.aiPct}
          </Text>
          <Spacer />
          <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
            BrainLift: {props.brainlift}
          </Text>
        </HStack>

        <Spacer />

        {/* Manager badge */}
        {props.isManager && props.pendingCount > 0 && (
          <HStack>
            <Text font={{ size: 13, weight: 'semibold' }} foregroundStyle="#FF3B30">
              {props.pendingCount} pending approval{props.pendingCount > 1 ? 's' : ''}
            </Text>
          </HStack>
        )}

        {/* Stale indicator */}
        {isStale(props.cachedAt) && (
          <Text font={{ size: 10 }} foregroundStyle="#FF9500">
            Cached: {formatCachedTime(props.cachedAt)}
          </Text>
        )}
      </VStack>
    </ZStack>
  );
}

// ─── Main widget ───────────────────────────────────────────────────────────────

// createWidget is provided by expo-widgets at build time
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createWidget } = require('expo-widgets');

const HourglassWidget = createWidget('HourglassWidget', (props: WidgetData & { widgetFamily?: string }) => {
  'widget';

  const family = props.widgetFamily ?? 'systemMedium';

  if (family === 'systemSmall') {
    return <SmallWidget props={props} />;
  }

  if (family === 'systemLarge') {
    return <LargeWidget props={props} />;
  }

  // Default: medium
  return <MediumWidget props={props} />;
});

export default HourglassWidget;

// Named exports for unit testing — allows tests to render sub-components directly
// without going through the expo-widgets createWidget/default export path.
export { SmallWidget, MediumWidget, LargeWidget };
