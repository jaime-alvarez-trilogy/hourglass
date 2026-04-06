```tsx
import React from 'react';
import {
  VStack,
  HStack,
  ZStack,
  Text,
  Spacer,
  Rectangle,
  RoundedRectangle,
  Circle,
} from '@expo/ui/swift-ui';
import { createWidget, WidgetSize } from 'expo-widgets';

const COLORS = {
  background: '#0D0C14',
  surface: '#16151F',
  surfaceElevated: '#1F1E29',
  border: '#2F2E41',

  textPrimary: '#E0E0E0',
  textSecondary: '#A0A0A0',
  textMuted: '#757575',

  gold: '#E8C97A',
  goldBright: '#FFDF89',
  cyan: '#00C2FF',
  violet: '#A78BFA',
  success: '#10B981',
  warning: '#F59E0B',
  critical: '#F43F5E',

  // Bar chart colors
  barPast: '#4A4A6A',
  barFuture: '#2F2E41',
};

type WidgetDailyEntry = {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  hours: number;
  isToday: boolean;
  isFuture: boolean;
};

type ApprovalItem = {
  id: string;
  name: string;
  hours: number;
  category: string;
};

type WidgetData = {
  hoursDisplay: string;
  earnings: string;
  hoursRemaining: string;
  paceBadge: 'on_track' | 'crushed_it' | 'behind' | 'critical';
  urgency: 'none' | 'low' | 'high' | 'critical' | 'expired';
  aiPct: string;
  brainlift: string;
  today: string;
  todayDelta: string;
  weekDeltaEarnings: string;
  pendingCount: number;
  isManager: boolean;
  daily: WidgetDailyEntry[];
  cachedAt: number;
  approvalItems: ApprovalItem[];
};

const PACE_COLOR_MAP = {
  on_track: COLORS.success,
  crushed_it: COLORS.goldBright,
  behind: COLORS.warning,
  critical: COLORS.critical,
};

const URGENCY_COLOR_MAP = {
  none: COLORS.violet,
  low: COLORS.warning,
  high: COLORS.critical,
  critical: COLORS.critical,
  expired: COLORS.textMuted,
};

// Glass Card component with glass pattern from brand guidelines
function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <ZStack>
      <RoundedRectangle fill="#16151FCC" cornerRadius={16} />
      <RoundedRectangle cornerRadius={16} stroke="#A78BFA40" strokeWidth={1} />
      <VStack padding={14} alignment="leading" spacing={6}>
        {children}
      </VStack>
    </ZStack>
  );
}

// Ambient glow circles behind background
function AmbientGlow() {
  return (
    <ZStack>
      {/* Large blurred blue-cyan circle top-left */}
      <Circle
        fill={COLORS.cyan}
        frame={{ width: 200, height: 200 }}
        offset={{ x: -80, y: -80 }}
        blur={40}
        opacity={0.12}
      />
      {/* Medium blurred violet circle top-right */}
      <Circle
        fill={COLORS.violet}
        frame={{ width: 140, height: 140 }}
        offset={{ x: 90, y: -60 }}
        blur={30}
        opacity={0.1}
      />
      {/* Smaller green success circle bottom-left */}
      <Circle
        fill={COLORS.success}
        frame={{ width: 100, height: 100 }}
        offset={{ x: -70, y: 80 }}
        blur={30}
        opacity={0.08}
      />
      {/* Small gold bright circle bottom-right */}
      <Circle
        fill={COLORS.goldBright}
        frame={{ width: 80, height: 80 }}
        offset={{ x: 70, y: 90 }}
        blur={20}
        opacity={0.06}
      />
    </ZStack>
  );
}

// Status Badge pill
function StatusBadge({ paceBadge }: { paceBadge: WidgetData['paceBadge'] }) {
  const color = PACE_COLOR_MAP[paceBadge] || COLORS.violet;
  const labelMap = {
    on_track: 'ON TRACK',
    crushed_it: 'CRUSHED IT',
    behind: 'BEHIND',
    critical: 'CRITICAL',
  };
  return (
    <RoundedRectangle
      fill={color}
      cornerRadius={12}
      stroke={color + '90'}
      strokeWidth={1.5}
      frame={{ height: 24 }}
    >
      <Text
        color={COLORS.background}
        font={{ size: 11, weight: 'semibold', design: 'default' }}
        padding={{ leading: 10, trailing: 10 }}
        alignment="center"
        uppercase
      >
        {labelMap[paceBadge] || 'N/A'}
      </Text>
    </RoundedRectangle>
  );
}

// Bar chart for 7-day hours
function HoursBarChart({
  daily,
  paceBadge,
}: {
  daily: WidgetDailyEntry[];
  paceBadge: WidgetData['paceBadge'];
}) {
  // Determine max hours to scale bars (avoid 0 max)
  const maxHours = Math.max(
    8,
    ...daily.map((d) => (d.isFuture ? 0 : d.hours)) // exclude future hours from max
  );

  // Bar colors: past bars muted purple-grey, today bar is pace color bright, future bars dark muted
  return (
    <HStack spacing={6} alignment="bottom" frame={{ height: 52 }}>
      {daily.map(({ day, hours, isToday, isFuture }, i) => {
        let barColor = COLORS.barPast;
        if (isToday) barColor = PACE_COLOR_MAP[paceBadge];
        else if (isFuture) barColor = COLORS.barFuture;
        const barHeight = Math.max(4, (hours / maxHours) * 48);

        return (
          <VStack key={day} alignment="center" spacing={4}>
            <Rectangle
              fill={barColor}
              frame={{ width: 8, height: barHeight }}
              cornerRadius={3}
              opacity={isFuture ? 0.4 : 1}
            />
            <Text
              color={COLORS.textMuted}
              font={{ size: 10, weight: 'medium', design: 'default' }}
              uppercase
            >
              {day}
            </Text>
          </VStack>
        );
      })}
    </HStack>
  );
}

// Small widget: show hours this week and earnings in two glass cards side by side,
// below a status bar with pace badge and hours remaining, then a small bar chart with day labels,
// and a bottom line with today delta and AI percent in cyan.
function SmallWidget({ data }: { data: WidgetData }) {
  const urgencyColor = URGENCY_COLOR_MAP[data.urgency];
  return (
    <ZStack fill={COLORS.background}>
      <AmbientGlow />
      <VStack spacing={12} padding={14} fill>
        {/* Two glass cards side by side */}
        <HStack spacing={10}>
          <GlassCard>
            <Text
              color={COLORS.success}
              font={{ size: 28, weight: 'heavy', design: 'default' }}
            >
              {data.hoursDisplay}
            </Text>
            <Text
              color={COLORS.textSecondary}
              font={{ size: 11, weight: 'medium', design: 'default' }}
              uppercase
            >
              THIS WEEK
            </Text>
          </GlassCard>
          <GlassCard>
            <Text
              color={COLORS.gold}
              font={{ size: 28, weight: 'heavy', design: 'default' }}
            >
              {data.earnings}
            </Text>
            <Text
              color={COLORS.textSecondary}
              font={{ size: 11, weight: 'medium', design: 'default' }}
              uppercase
            >
              EARNED
            </Text>
          </GlassCard>
        </HStack>

        {/* Status bar with badge and hours remaining */}
        <HStack
          fill
          spacing={6}
          alignment="center"
          padding={{ top: 2, bottom: 2, leading: 10, trailing: 10 }}
        >
          <StatusBadge paceBadge={data.paceBadge} />
          <Spacer />
          <Text
            color={COLORS.textSecondary}
            font={{ size: 12, weight: 'medium', design: 'default' }}
            lineLimit={1}
          >
            {data.hoursRemaining} left
          </Text>
        </HStack>

        {/* Label: Activity */}
        <Text
          color={COLORS.textMuted}
          font={{ size: 11, weight: 'semibold', design: 'default' }}
          uppercase
          padding={{ leading: 6 }}
        >
          ACTIVITY
        </Text>

        {/* Bar chart for the week */}
        <HoursBarChart daily={data.daily} paceBadge={data.paceBadge} />

        {/* Bottom line with today delta and AI percent */}
        <HStack fill spacing={6} alignment="center" padding={{ top: 2 }}>
          <Text
            color={urgencyColor}
            font={{ size: 12, weight: 'medium', design: 'default' }}
            lineLimit={1}
          >
            Today: {data.todayDelta}
          </Text>
          <Spacer />
          <Text
            color={COLORS.cyan}
            font={{ size: 12, weight: 'medium', design: 'monospaced' }}
            lineLimit={1}
          >
            AI: {data.aiPct}
          </Text>
        </HStack>
      </VStack>
    </ZStack>
  );
}

// Medium widget: stacked vertical layout, hours & status top, bar chart, brainlift+earnings bottom row
function MediumWidget({ data }: { data: WidgetData }) {
  const urgencyColor = URGENCY_COLOR_MAP[data.urgency];
  return (
    <ZStack fill={COLORS.background}>
      <AmbientGlow />
      <VStack spacing={14} padding={16} fill>
        {/* Top GlassCard: Hours, status, breakdown */}
        <GlassCard>
          <VStack spacing={6} alignment="leading">
            <Text
              color={COLORS.textPrimary}
              font={{ size: 32, weight: 'heavy', design: 'default' }}
            >
              {data.hoursDisplay}
            </Text>
            <Text
              color={COLORS.textSecondary}
              font={{ size: 12, weight: 'medium', design: 'default' }}
              uppercase
            >
              OF 40H GOAL
            </Text>
            <StatusBadge paceBadge={data.paceBadge} />

            <HStack spacing={14} padding={{ top: 8 }}>
              <VStack alignment="leading" spacing={2}>
                <Text
                  color={COLORS.textSecondary}
                  font={{ size: 11, weight: 'semibold', design: 'default' }}
                  uppercase
                >
                  TODAY
                </Text>
                <Text
                  color={urgencyColor}
                  font={{ size: 16, weight: 'heavy', design: 'default' }}
                >
                  {data.today}
                </Text>
              </VStack>
              <VStack alignment="leading" spacing={2}>
                <Text
                  color={COLORS.textSecondary}
                  font={{ size: 11, weight: 'semibold', design: 'default' }}
                  uppercase
                >
                  AVG/DAY
                </Text>
                {/* avg/day is hoursDisplay divided by days elapsed (assumed ~3) */}
                {/* No avg/day in data, so we calculate approx */}
                <Text
                  color={COLORS.textPrimary}
                  font={{ size: 16, weight: 'heavy', design: 'default' }}
                >
                  {(() => {
                    const parsed = parseFloat(data.hoursDisplay.replace('h', ''));
                    const avg = parsed > 0 ? (parsed / 3).toFixed(1) : '-';
                    return avg + 'h';
                  })()}
                </Text>
              </VStack>
              <VStack alignment="leading" spacing={2}>
                <Text
                  color={COLORS.textSecondary}
                  font={{ size: 11, weight: 'semibold', design: 'default' }}
                  uppercase
                >
                  REMAINING
                </Text>
                <Text
                  color={COLORS.textPrimary}
                  font={{ size: 16, weight: 'heavy', design: 'default' }}
                >
                  {data.hoursRemaining}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </GlassCard>

        {/* Bar Chart GlassCard */}
        <GlassCard>
          <VStack spacing={6} alignment="leading">
            <Text
              color={COLORS.textMuted}
              font={{ size: 11, weight: 'semibold', design: 'default' }}
              uppercase
            >
              THIS WEEK
            </Text>
            <HoursBarChart daily={data.daily} paceBadge={data.paceBadge} />
          </VStack>
        </GlassCard>

        {/* Bottom row: BrainLift violet and Earnings gold cards horizontally */}
        <HStack spacing={14} fill>
          <GlassCard>
            <VStack spacing={4} alignment="leading">
              <Text
                color={COLORS.violet}
                font={{ size: 11, weight: 'semibold', design: 'default' }}
                uppercase
              >
                BRAINLIFT
              </Text>
              <Text
                color={COLORS.violet}
                font={{ size: 24, weight: 'heavy', design: 'default' }}
              >
                {data.brainlift}
              </Text>
            </VStack>
          </GlassCard>
          <GlassCard>
            <VStack spacing={4} alignment="leading">
              <Text
                color={COLORS.gold}
                font={{ size: 11, weight: 'semibold', design: 'default' }}
                uppercase
              >
                EARNINGS
              </Text>
              <Text
                color={COLORS.gold}
                font={{ size: 24, weight: 'heavy', design: 'default' }}
              >
                {data.earnings}
              </Text>
            </VStack>
          </GlassCard>
        </HStack>
      </VStack>
    </ZStack>
  );
}

// Large widget: full dashboard - hours, status, big bar chart, AI trajectory and earnings panels
function LargeWidget({ data }: { data: WidgetData }) {
  const urgencyColor = URGENCY_COLOR_MAP[data.urgency];
  return (
    <ZStack fill={COLORS.background}>
      <AmbientGlow />
      <VStack spacing={16} padding={16} fill>
        {/* Top: Hours and status with subtitle */}
        <GlassCard>
          <VStack spacing={8} alignment="leading">
            <Text
              color={COLORS.textPrimary}
              font={{ size: 36, weight: 'heavy', design: 'default' }}
            >
              {data.hoursDisplay}
            </Text>
            <Text
              color={COLORS.textSecondary}
              font={{ size: 14, weight: 'medium', design: 'default' }}
            >
              of 40h goal
            </Text>
            <StatusBadge paceBadge={data.paceBadge} />

            <HStack spacing={20} padding={{ top: 8 }}>
              <VStack alignment="leading" spacing={2}>
                <Text
                  color={COLORS.textSecondary}
                  font={{ size: 12, weight: 'semibold', design: 'default' }}
                  uppercase
                >
                  TODAY
                </Text>
                <Text
                  color={urgencyColor}
                  font={{ size: 20, weight: 'heavy', design: 'default' }}
                >
                  {data.today}
                </Text>
              </VStack>
              <VStack alignment="leading" spacing={2}>
                <Text
                  color={COLORS.textSecondary}
                  font={{ size: 12, weight: 'semibold', design: 'default' }}
                  uppercase
                >
                  AVG/DAY
                </Text>
                <Text
                  color={COLORS.textPrimary}
                  font={{ size: 20, weight: 'heavy', design: 'default' }}
                >
                  {(() => {
                    const parsed = parseFloat(data.hoursDisplay.replace('h', ''));
                    const avg = parsed > 0 ? (parsed / 3).toFixed(1) : '-';
                    return avg + 'h';
                  })()}
                </Text>
              </VStack>
              <VStack alignment="leading" spacing={2}>
                <Text
                  color={COLORS.textSecondary}
                  font={{ size: 12, weight: 'semibold', design: 'default' }}
                  uppercase
                >
                  REMAINING
                </Text>
                <Text
                  color={COLORS.textPrimary}
                  font={{ size: 20, weight: 'heavy', design: 'default' }}
                >
                  {data.hoursRemaining}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </GlassCard>

        {/* Big weekly hours bar chart panel */}
        <GlassCard>
          <VStack spacing={8} alignment="leading">
            <Text
              color={COLORS.textMuted}
              font={{ size: 13, weight: 'semibold', design: 'default' }}
              uppercase
            >
              THIS WEEK
            </Text>
            <HoursBarChart daily={data.daily} paceBadge={data.paceBadge} />
          </VStack>
        </GlassCard>

        {/* AI trajectory panel - simplified as info text due to primitives only */}
        <GlassCard>
          <VStack spacing={8} alignment="leading">
            <Text
              color={COLORS.cyan}
              font={{ size: 13, weight: 'semibold', design: 'default' }}
              uppercase
            >
              AI TRAJECTORY
            </Text>
            <Text
              color={COLORS.cyan}
              font={{ size: 16, weight: 'medium', design: 'monospaced' }}
              lineLimit={1}
              // Show range and trend: e.g. "Stable around 74%–78%"
            >
              Stable around {data.aiPct}
            </Text>
          </VStack>
        </GlassCard>

        {/* Earnings panel */}
        <GlassCard>
          <VStack spacing={8} alignment="leading">
            <Text
              color={COLORS.gold}
              font={{ size: 13, weight: 'semibold', design: 'default' }}
              uppercase
            >
              EARNINGS
            </Text>
            <Text
              color={COLORS.goldBright}
              font={{ size: 28, weight: 'heavy', design: 'default' }}
            >
              {data.earnings}
            </Text>
            <Text
              color={COLORS.textSecondary}
              font={{ size: 12, weight: 'medium', design: 'default' }}
            >
              this week
            </Text>
          </VStack>
        </GlassCard>
      </VStack>
    </ZStack>
  );
}

const HourglassWidget = createWidget<WidgetData>({
  name: 'HourglassWidget',
  getData: async () => {
    // Dummy static data for preview/testing - replace with real data source
    const now = Date.now();
    return {
      hoursDisplay: '22.3h',
      earnings: '$1,117',
      hoursRemaining: '17.7h',
      paceBadge: 'on_track',
      urgency: 'none',
      aiPct: '74%–78%',
      brainlift: '3.2h',
      today: '+5.0h',
      todayDelta: '-3.3h',
      weekDeltaEarnings: '$50',
      pendingCount: 2,
      isManager: false,
      daily: [
        { day: 'Mon', hours: 4.5, isToday: false, isFuture: false },
        { day: 'Tue', hours: 7.0, isToday: false, isFuture: false },
        { day: 'Wed', hours: 5.2, isToday: true, isFuture: false },
        { day: 'Thu', hours: 0, isToday: false, isFuture: true },
        { day: 'Fri', hours: 0, isToday: false, isFuture: true },
        { day: 'Sat', hours: 0, isToday: false, isFuture: true },
        { day: 'Sun', hours: 0, isToday: false, isFuture: true },
      ],
      cachedAt: now,
      approvalItems: [],
    };
  },

  render: ({ data, size }) => {
    switch (size) {
      case WidgetSize.SMALL:
        return <SmallWidget data={data} />;
      case WidgetSize.MEDIUM:
        return <MediumWidget data={data} />;
      case WidgetSize.LARGE:
        return <LargeWidget data={data} />;
      default:
        return <SmallWidget data={data} />;
    }
  },
});

export default HourglassWidget;
```

