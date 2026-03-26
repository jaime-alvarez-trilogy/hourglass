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
//
// 01-ios-hud-layout:
//   FR1: getPriority helper — P1 (approvals), P2 (deficit), P3 (default)
//   FR2: SmallWidget hero font weight: 'heavy', design: 'monospaced'
//   FR3: MediumWidget priority-branched layouts
//   FR4: LargeWidget priority-branched layouts + bottom padding fix
//   FR5: Today row uses todayDelta with fallback to today

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

// ─── FR1 (01-ios-hud-layout): Priority mode helper ───────────────────────────
// Returns the display priority mode for Medium/Large widgets:
//   'approvals' — P1: manager with pending approvals (most actionable)
//   'deficit'   — P2: pace is behind or critical
//   'default'   — P3: on track / normal state

export function getPriority(props: WidgetData): 'approvals' | 'deficit' | 'default' {
  if (props.isManager && props.pendingCount > 0) return 'approvals';
  if (props.paceBadge === 'critical' || props.paceBadge === 'behind') return 'deficit';
  return 'default';
}

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
// 01-ios-hud-layout FR2: hero font updated to weight: 'heavy', design: 'monospaced'

function SmallWidget({ props }: { props: WidgetData }) {
  const accent = URGENCY_ACCENT[props.urgency] ?? URGENCY_ACCENT.none;
  const tint   = URGENCY_TINTS[props.urgency]  ?? URGENCY_TINTS.none;

  return (
    <ZStack>
      {/* FR3: gradient background layers */}
      <Rectangle fill="#0D0C14" />
      <Rectangle fill={tint} />

      <VStack padding={12}>
        {/* Hours total — FR2: weight 'heavy', design 'monospaced' */}
        <Text
          font={{ size: 28, weight: 'heavy', design: 'monospaced' }}
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
// 01-ios-hud-layout FR3: priority-branched layouts (P1/P2/P3)

function MediumWidget({ props }: { props: WidgetData }) {
  const accent   = URGENCY_ACCENT[props.urgency] ?? URGENCY_ACCENT.none;
  const tint     = URGENCY_TINTS[props.urgency]  ?? URGENCY_TINTS.none;
  const priority = getPriority(props);

  // P1 overrides tint to high-urgency orange
  const bgTint = priority === 'approvals' ? '#FF6B0020' : tint;

  return (
    <ZStack>
      {/* FR3: gradient background layers */}
      <Rectangle fill="#0D0C14" />
      <Rectangle fill={bgTint} />

      <VStack padding={12}>

        {/* ── P1: Approvals layout ── */}
        {priority === 'approvals' && (
          <>
            <Text font={{ size: 13, weight: 'semibold' }} foregroundStyle={accent}>
              PENDING APPROVALS
            </Text>
            <Text font={{ size: 12 }} foregroundStyle="#DDDDDD">
              {props.pendingCount} items requiring action
            </Text>
            {props.approvalItems.slice(0, 2).map((item) => (
              <HStack key={item.id}>
                <Text font={{ size: 12 }} foregroundStyle="#FFFFFF">{item.name}</Text>
                <Spacer />
                <Text font={{ size: 11 }} foregroundStyle="#AAAAAA">{item.hours}</Text>
                <Text font={{ size: 10 }} foregroundStyle={accent}> {item.category}</Text>
              </HStack>
            ))}
          </>
        )}

        {/* ── P2: Deficit layout ── */}
        {priority === 'deficit' && (
          <>
            <Text font={{ size: 13, weight: 'semibold' }} foregroundStyle="#FF3B30">
              {PACE_LABELS[props.paceBadge]}
            </Text>
            <Text font={{ size: 32, weight: 'heavy', design: 'monospaced' }} foregroundStyle={accent}>
              {props.hoursDisplay}
            </Text>
            <Text font={{ size: 12 }} foregroundStyle="#AAAAAA">
              {props.hoursRemaining}
            </Text>
            <Spacer />
            <HStack>
              <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
                {props.today}
              </Text>
              <Spacer />
              <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
                {props.weekDeltaEarnings}
              </Text>
            </HStack>
          </>
        )}

        {/* ── P3: Default layout ── */}
        {priority === 'default' && (
          <>
            {/* Two glass cards side by side */}
            <HStack spacing={8}>
              <IosGlassCard>
                <Text font={{ size: 32, weight: 'heavy', design: 'monospaced' }} foregroundStyle={accent}>
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

            {/* FR5: Bottom row — todayDelta with fallback to today */}
            <HStack>
              <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
                Today: {props.todayDelta || props.today}
              </Text>
              <Spacer />
              <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
                AI: {props.aiPct}
              </Text>
            </HStack>

            {/* Stale indicator */}
            {isStale(props.cachedAt) && (
              <Text font={{ size: 10 }} foregroundStyle="#FF9500">
                Cached: {formatCachedTime(props.cachedAt)}
              </Text>
            )}
          </>
        )}

      </VStack>
    </ZStack>
  );
}

// ─── Large widget ──────────────────────────────────────────────────────────────
// 01-ios-hud-layout FR4: priority-branched layouts + bottom padding fix (28pt)

function LargeWidget({ props }: { props: WidgetData }) {
  const accent   = URGENCY_ACCENT[props.urgency] ?? URGENCY_ACCENT.none;
  const tint     = URGENCY_TINTS[props.urgency]  ?? URGENCY_TINTS.none;
  const priority = getPriority(props);

  // P1 overrides tint to high-urgency orange
  const bgTint = priority === 'approvals' ? '#FF6B0020' : tint;

  return (
    <ZStack>
      {/* FR3: gradient background layers */}
      <Rectangle fill="#0D0C14" />
      <Rectangle fill={bgTint} />

      {/* FR4: bottom padding increased to 28pt to prevent OS clipping */}
      <VStack padding={{ top: 16, leading: 16, trailing: 16, bottom: 28 }}>

        {/* ── P1: Approvals layout ── */}
        {priority === 'approvals' && (
          <>
            <Text font={{ size: 14, weight: 'semibold' }} foregroundStyle={accent}>
              PENDING APPROVALS
            </Text>
            <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
              {props.pendingCount} items requiring action
            </Text>
            <Spacer />
            {props.approvalItems.slice(0, 3).map((item) => (
              <HStack key={item.id}>
                <Text font={{ size: 13 }} foregroundStyle="#FFFFFF">{item.name}</Text>
                <Spacer />
                <Text font={{ size: 12 }} foregroundStyle="#AAAAAA">{item.hours}</Text>
                <Text font={{ size: 11 }} foregroundStyle={accent}> {item.category}</Text>
              </HStack>
            ))}
            <Spacer />
            {/* Stale indicator */}
            {isStale(props.cachedAt) && (
              <Text font={{ size: 10 }} foregroundStyle="#FF9500">
                Cached: {formatCachedTime(props.cachedAt)}
              </Text>
            )}
          </>
        )}

        {/* ── P2: Deficit layout ── */}
        {priority === 'deficit' && (
          <>
            <Text font={{ size: 14, weight: 'semibold' }} foregroundStyle="#FF3B30">
              {PACE_LABELS[props.paceBadge]}
            </Text>
            <Text font={{ size: 36, weight: 'heavy', design: 'monospaced' }} foregroundStyle={accent}>
              {props.hoursDisplay}
            </Text>
            <Text font={{ size: 13 }} foregroundStyle="#AAAAAA">
              {props.hoursRemaining}
            </Text>
            <Spacer />
            <HStack>
              <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
                {props.today}
              </Text>
              <Spacer />
              <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
                {props.weekDeltaEarnings}
              </Text>
            </HStack>
            {/* Stale indicator */}
            {isStale(props.cachedAt) && (
              <Text font={{ size: 10 }} foregroundStyle="#FF9500">
                Cached: {formatCachedTime(props.cachedAt)}
              </Text>
            )}
          </>
        )}

        {/* ── P3: Default layout ── */}
        {priority === 'default' && (
          <>
            {/* Hero row — two glass cards */}
            <HStack spacing={8}>
              <IosGlassCard>
                <Text font={{ size: 36, weight: 'heavy', design: 'monospaced' }} foregroundStyle={accent}>
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

            {/* FR5: Today + delta vs daily average */}
            <HStack>
              <Text font={{ size: 13 }} foregroundStyle="#DDDDDD">
                Today: {props.todayDelta || props.today}
              </Text>
              <Spacer />
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

            {/* Stale indicator */}
            {isStale(props.cachedAt) && (
              <Text font={{ size: 10 }} foregroundStyle="#FF9500">
                Cached: {formatCachedTime(props.cachedAt)}
              </Text>
            )}
          </>
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
