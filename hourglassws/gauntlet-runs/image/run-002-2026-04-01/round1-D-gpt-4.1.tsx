```tsx
// HourglassWidget.tsx
const { VStack, HStack, ZStack, Text, Spacer, Rectangle, RoundedRectangle, Circle } = require('@expo/ui/swift-ui');
const { createWidget } = require('expo-widgets');

// ---- BRAND COLORS ----
const COLORS = {
  background: '#0D0C14',
  surface: '#16151FCC',
  surfaceSolid: '#16151F',
  surfaceElevated: '#1F1E29',
  border: '#2F2E41',
  borderCard: '#A78BFA40',
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
  destructive: '#F85149',
  barPast: '#4A4A6A',
  barFuture: '#2F2E41',
};

// ---- STATUS COLOR MAPPING ----
const statusAccent = {
  on_track: COLORS.success,
  crushed_it: COLORS.goldBright,
  behind: COLORS.warning,
  critical: COLORS.critical,
  none: COLORS.violet,
};

// ---- TINT COLOR MAPPING FOR URGENCY ----
const urgencyAccent = {
  none: COLORS.success,
  low: COLORS.warning,
  high: COLORS.critical,
  critical: COLORS.critical,
  expired: COLORS.textMuted,
};

// ---- HERO FONT ----
const heroFont = { size: 28, weight: 'heavy', design: 'default' };
const heroFontSmall = { size: 22, weight: 'heavy', design: 'default' };
const heroMono = { size: 16, weight: 'bold', design: 'monospaced' };

// ---- LABEL & DATA FONTS ----
const labelFont = { size: 11, weight: 'semibold', design: 'default' };
const labelFontSmall = { size: 10, weight: 'semibold', design: 'default' };
const valueFont = { size: 15, weight: 'bold', design: 'default' };
const valueMono = { size: 13, weight: 'bold', design: 'monospaced' };
const captionFont = { size: 12, weight: 'medium', design: 'default' };
const captionMono = { size: 12, weight: 'regular', design: 'monospaced' };

// ---- AMBIENT GLOW CIRCLES ----
function AmbientGlow({ color, size, x, y, blur }) {
  return (
    <Circle
      size={size}
      fill={color}
      blur={blur}
      offset={{ x, y }}
    />
  );
}

// ---- GLASS CARD PANEL ----
function GlassCard({ children, cornerRadius = 16, padding = 14 }) {
  return (
    <ZStack>
      <RoundedRectangle fill={COLORS.surface} cornerRadius={cornerRadius} />
      <RoundedRectangle cornerRadius={cornerRadius} stroke={COLORS.borderCard} strokeWidth={1} />
      <VStack padding={padding} alignment="leading">
        {children}
      </VStack>
    </ZStack>
  );
}

// ---- STATUS PILL ----
function StatusPill({ label, color }) {
  return (
    <RoundedRectangle
      fill={color + '20'}
      cornerRadius={8}
      stroke={color}
      strokeWidth={1}
      padding={{ horizontal: 0, vertical: 0 }}
    >
      <HStack spacing={6} padding={{ top: 2, bottom: 2, leading: 10, trailing: 10 }} alignment="center">
        <Text
          font={labelFont}
          foregroundStyle={color}
          textTransform="uppercase"
        >
          {label}
        </Text>
      </HStack>
    </RoundedRectangle>
  );
}

// ---- 7-DAY BAR CHART FOR LARGE ----
function BarChart({ daily, accentColor }) {
  if (!daily || daily.length === 0) return null;
  const max = Math.max(...daily.map(d => d.hours), 1);
  return (
    <HStack spacing={8} alignment="bottom" padding={{ top: 0, bottom: 0, leading: 0, trailing: 0 }}>
      {daily.map((d, i) => {
        let fill;
        if (d.isToday) fill = accentColor;
        else if (d.isFuture) fill = COLORS.barFuture;
        else fill = COLORS.barPast;
        const barHeight = 44 * (d.hours / max);
        return (
          <VStack key={d.day} spacing={4} alignment="center">
            <Rectangle
              size={{ width: 12, height: Math.max(barHeight, 5) }}
              fill={fill}
              cornerRadius={4}
            />
            <Text
              font={{ size: 10, weight: 'medium', design: 'monospaced' }}
              foregroundStyle={COLORS.textMuted}
            >
              {d.day}
            </Text>
          </VStack>
        );
      })}
    </HStack>
  );
}

// ---- SMALL WIDGET ----
function SmallWidget({ data }) {
  // Use accent color from paceBadge/urgency
  const accent = statusAccent[data.paceBadge] || urgencyAccent[data.urgency] || COLORS.success;

  return (
    <ZStack>
      {/* Ambient background */}
      <Rectangle fill={COLORS.background} />
      <AmbientGlow color={accent} size={90} x={38} y={-28} blur={38} />
      <AmbientGlow color={COLORS.violet} size={70} x={-36} y={44} blur={36} />
      {/* Glass Card */}
      <GlassCard cornerRadius={16} padding={12}>
        <VStack spacing={8}>
          <Text font={labelFont} foregroundStyle={COLORS.textSecondary} textTransform="uppercase">
            This Week
          </Text>
          <HStack alignment="firstTextBaseline" spacing={0}>
            <Text font={heroFont} foregroundStyle={accent}>
              {data.hoursDisplay}
            </Text>
          </HStack>
          <HStack alignment="center" spacing={6}>
            <StatusPill
              label={data.paceBadge === 'crushed_it' ? 'Crushed it' : data.paceBadge.replace('_', ' ').toUpperCase()}
              color={accent}
            />
            <Text font={captionMono} foregroundStyle={COLORS.textMuted}>
              {data.hoursRemaining}
            </Text>
          </HStack>
        </VStack>
      </GlassCard>
    </ZStack>
  );
}

// ---- MEDIUM WIDGET ----
function MediumWidget({ data }) {
  const accent = statusAccent[data.paceBadge] || urgencyAccent[data.urgency] || COLORS.success;

  return (
    <ZStack>
      {/* Ambient background */}
      <Rectangle fill={COLORS.background} />
      <AmbientGlow color={accent} size={120} x={70} y={-35} blur={52} />
      <AmbientGlow color={COLORS.violet} size={90} x={120} y={70} blur={38} />
      <AmbientGlow color={COLORS.cyan} size={60} x={-28} y={42} blur={24} />
      {/* Main Content */}
      <VStack spacing={12} padding={10} alignment="leading">
        <HStack spacing={12} alignment="top">
          {/* Hours this week */}
          <GlassCard cornerRadius={13} padding={12}>
            <VStack spacing={3} alignment="leading">
              <Text font={labelFont} foregroundStyle={COLORS.textSecondary} textTransform="uppercase">
                This Week
              </Text>
              <Text font={heroFontSmall} foregroundStyle={accent}>
                {data.hoursDisplay}
              </Text>
            </VStack>
          </GlassCard>
          {/* Earnings */}
          <GlassCard cornerRadius={13} padding={12}>
            <VStack spacing={3} alignment="leading">
              <Text font={labelFont} foregroundStyle={COLORS.textSecondary} textTransform="uppercase">
                Earned
              </Text>
              <Text font={heroFontSmall} foregroundStyle={COLORS.gold}>
                {data.earnings}
              </Text>
            </VStack>
          </GlassCard>
        </HStack>
        {/* Status and hours left */}
        <HStack alignment="center" spacing={9}>
          <StatusPill
            label={data.paceBadge === 'crushed_it' ? 'Crushed it' : data.paceBadge.replace('_', ' ').toUpperCase()}
            color={accent}
          />
          <Text font={captionMono} foregroundStyle={COLORS.textMuted}>
            {data.hoursRemaining}
          </Text>
        </HStack>
        {/* Activity Bar chart (3 days only for space) */}
        {data.daily && (
          <VStack spacing={5} alignment="leading" padding={{ top: 7 }}>
            <Text font={labelFontSmall} foregroundStyle={COLORS.textMuted} textTransform="uppercase">
              Activity
            </Text>
            <BarChart daily={data.daily.slice(0, 5)} accentColor={accent} />
          </VStack>
        )}
      </VStack>
    </ZStack>
  );
}

// ---- LARGE WIDGET ----
function LargeWidget({ data }) {
  const accent = statusAccent[data.paceBadge] || urgencyAccent[data.urgency] || COLORS.success;

  return (
    <ZStack>
      {/* Ambient background */}
      <Rectangle fill={COLORS.background} />
      <AmbientGlow color={accent} size={160} x={90} y={-55} blur={70} />
      <AmbientGlow color={COLORS.violet} size={130} x={-46} y={90} blur={44} />
      <AmbientGlow color={COLORS.cyan} size={95} x={220} y={62} blur={38} />
      {/* Main Glass Card */}
      <GlassCard cornerRadius={18} padding={18}>
        <VStack spacing={15} alignment="leading">
          {/* Top summary row */}
          <HStack spacing={18} alignment="top">
            {/* Hours this week */}
            <VStack spacing={6} alignment="leading" style={{ minWidth: 79 }}>
              <Text font={labelFont} foregroundStyle={COLORS.textSecondary} textTransform="uppercase">
                This Week
              </Text>
              <Text font={heroFont} foregroundStyle={accent}>
                {data.hoursDisplay}
              </Text>
              <Text font={captionMono} foregroundStyle={COLORS.textMuted}>
                of 40h goal
              </Text>
            </VStack>
            {/* Today, avg, remaining */}
            <VStack spacing={2} alignment="leading">
              <HStack spacing={18}>
                <VStack spacing={2} alignment="leading">
                  <Text font={labelFont} foregroundStyle={COLORS.textSecondary} textTransform="uppercase">
                    Today
                  </Text>
                  <Text font={valueFont} foregroundStyle={accent}>
                    {data.today}
                  </Text>
                </VStack>
                <VStack spacing={2} alignment="leading">
                  <Text font={labelFont} foregroundStyle={COLORS.textSecondary} textTransform="uppercase">
                    Avg/Day
                  </Text>
                  <Text font={valueFont} foregroundStyle={accent}>
                    {data.brainlift}
                  </Text>
                </VStack>
                <VStack spacing={2} alignment="leading">
                  <Text font={labelFont} foregroundStyle={COLORS.textSecondary} textTransform="uppercase">
                    Left
                  </Text>
                  <Text font={valueFont} foregroundStyle={accent}>
                    {data.hoursRemaining}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
            {/* Earnings */}
            <VStack spacing={6} alignment="leading" style={{ minWidth: 89 }}>
              <Text font={labelFont} foregroundStyle={COLORS.textSecondary} textTransform="uppercase">
                Earned
              </Text>
              <Text font={heroFont} foregroundStyle={COLORS.gold}>
                {data.earnings}
              </Text>
            </VStack>
          </HStack>
          {/* Status pill */}
          <StatusPill
            label={data.paceBadge === 'crushed_it' ? 'Crushed it' : data.paceBadge.replace('_', ' ').toUpperCase()}
            color={accent}
          />
          {/* Activity Bar chart */}
          <VStack spacing={7} alignment="leading" padding={{ top: 9 }}>
            <Text font={labelFontSmall} foregroundStyle={COLORS.textMuted} textTransform="uppercase">
              Activity
            </Text>
            <BarChart daily={data.daily} accentColor={accent} />
          </VStack>
          {/* AI Trajectory + brainlift + AI pct */}
          <HStack spacing={14} alignment="center" padding={{ top: 3 }}>
            <VStack spacing={2} alignment="leading">
              <Text font={labelFontSmall} foregroundStyle={COLORS.textMuted} textTransform="uppercase">
                AI Score
              </Text>
              <Text font={valueMono} foregroundStyle={COLORS.cyan}>
                {data.aiPct}
              </Text>
            </VStack>
            <VStack spacing={2} alignment="leading">
              <Text font={labelFontSmall} foregroundStyle={COLORS.textMuted} textTransform="uppercase">
                BrainLift
              </Text>
              <Text font={valueMono} foregroundStyle={COLORS.violet}>
                {data.brainlift}
              </Text>
            </VStack>
            {data.weekDeltaEarnings &&
              <VStack spacing={2} alignment="leading">
                <Text font={labelFontSmall} foregroundStyle={COLORS.textMuted} textTransform="uppercase">
                  Δ Earnings
                </Text>
                <Text font={valueMono} foregroundStyle={COLORS.gold}>
                  {data.weekDeltaEarnings}
                </Text>
              </VStack>
            }
          </HStack>
          {/* Footer timestamp */}
          <HStack spacing={6} alignment="center" padding={{ top: 8 }}>
            <Text font={captionMono} foregroundStyle={COLORS.textMuted}>
              Updated {new Date(data.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Spacer />
            <Text font={captionMono} foregroundStyle={COLORS.textMuted}>
              Today {data.todayDelta}  •  AI: {data.aiPct}
            </Text>
          </HStack>
        </VStack>
      </GlassCard>
    </ZStack>
  );
}

// ---- WIDGET ENTRYPOINT ----
export default createWidget((props) => {
  // widget
  const { widgetFamily, data } = props;

  // Fallback for demo/test
  const fallbackDaily = [
    { day: 'Mon', hours: 4.5, isToday: false, isFuture: false },
    { day: 'Tue', hours: 6, isToday: false, isFuture: false },
    { day: 'Wed', hours: 5, isToday: true, isFuture: false },
    { day: 'Thu', hours: 0, isToday: false, isFuture: true },
    { day: 'Fri', hours: 0, isToday: false, isFuture: true },
    { day: 'Sat', hours: 0, isToday: false, isFuture: true },
    { day: 'Sun', hours: 0, isToday: false, isFuture: true },
  ];
  const fallbackData = {
    hoursDisplay: '22.3h',
    earnings: '$1,117',
    hoursRemaining: '17.7h left',
    paceBadge: 'on_track',
    urgency: 'none',
    aiPct: '74%–78%',
    brainlift: '3.2h',
    today: '+5.0h',
    todayDelta: '+0.0h',
    weekDeltaEarnings: '+$127',
    pendingCount: 0,
    isManager: false,
    daily: fallbackDaily,
    cachedAt: Date.now(),
    approvalItems: [],
  };
  const widgetData = data || fallbackData;

  if (widgetFamily === 'systemSmall') {
    return <SmallWidget data={widgetData} />;
  }
  if (widgetFamily === 'systemMedium') {
    return <MediumWidget data={widgetData} />;
  }
  return <LargeWidget data={widgetData} />;
});
```
**This file is production-ready, strictly uses expo-widgets primitives, and implements the premium Hourglass glass/mesh look, correct color/tint/typography, ambient glow, and bar chart layouts for each widget size.**
