

```tsx
const { VStack, HStack, ZStack, Text, Spacer, Rectangle, RoundedRectangle, Circle } = require('@expo/ui/swift-ui');
const { createWidget } = require('expo-widgets');

// ─── Color Constants ───────────────────────────────────────────────
const C = {
  bg: '#0D0C14',
  surface: '#16151FCC',
  surfaceSolid: '#16151F',
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
  barPast: '#4A4A6A',
  barFuture: '#2F2E41',
  pillBorderAlpha: '60',
};

// ─── Helpers ───────────────────────────────────────────────────────
function accentForUrgency(urgency: string): string {
  switch (urgency) {
    case 'none': return C.success;
    case 'low': return C.warning;
    case 'high': return C.critical;
    case 'critical': return C.critical;
    case 'expired': return C.textMuted;
    default: return C.success;
  }
}

function accentForPace(pace: string): string {
  switch (pace) {
    case 'on_track': return C.success;
    case 'crushed_it': return C.goldBright;
    case 'behind': return C.warning;
    case 'critical': return C.critical;
    default: return C.success;
  }
}

function paceLabel(pace: string): string {
  switch (pace) {
    case 'on_track': return 'ON TRACK';
    case 'crushed_it': return 'CRUSHED IT';
    case 'behind': return 'BEHIND';
    case 'critical': return 'CRITICAL';
    default: return 'ON TRACK';
  }
}

function glowColorForPace(pace: string): string {
  switch (pace) {
    case 'on_track': return '#10B98130';
    case 'crushed_it': return '#FFDF8930';
    case 'behind': return '#F59E0B30';
    case 'critical': return '#F43F5E30';
    default: return '#A78BFA20';
  }
}

// ─── Reusable Sub-Components ───────────────────────────────────────

function AmbientBackground({ pace, size }: { pace: string; size: 'small' | 'medium' | 'large' }) {
  const glowColor = glowColorForPace(pace);
  const accentGlow = accentForPace(pace) + '18';

  if (size === 'small') {
    return (
      <ZStack>
        <Rectangle fill={C.bg} />
        <Circle fill={glowColor} frame={{ width: 120, height: 120 }} blur={50} offset={{ x: -40, y: -50 }} />
        <Circle fill={accentGlow} frame={{ width: 80, height: 80 }} blur={40} offset={{ x: 50, y: 40 }} />
        <Circle fill="#A78BFA12" frame={{ width: 60, height: 60 }} blur={35} offset={{ x: 30, y: -30 }} />
      </ZStack>
    );
  }

  if (size === 'medium') {
    return (
      <ZStack>
        <Rectangle fill={C.bg} />
        <Circle fill={glowColor} frame={{ width: 160, height: 160 }} blur={60} offset={{ x: -80, y: -40 }} />
        <Circle fill={accentGlow} frame={{ width: 120, height: 120 }} blur={50} offset={{ x: 100, y: 30 }} />
        <Circle fill="#A78BFA10" frame={{ width: 90, height: 90 }} blur={45} offset={{ x: 40, y: -50 }} />
        <Circle fill="#00C2FF0C" frame={{ width: 70, height: 70 }} blur={35} offset={{ x: -50, y: 50 }} />
      </ZStack>
    );
  }

  // large
  return (
    <ZStack>
      <Rectangle fill={C.bg} />
      <Circle fill={glowColor} frame={{ width: 200, height: 200 }} blur={70} offset={{ x: -80, y: -100 }} />
      <Circle fill={accentGlow} frame={{ width: 150, height: 150 }} blur={60} offset={{ x: 100, y: 60 }} />
      <Circle fill="#A78BFA12" frame={{ width: 120, height: 120 }} blur={50} offset={{ x: 50, y: -80 }} />
      <Circle fill="#00C2FF0D" frame={{ width: 100, height: 100 }} blur={45} offset={{ x: -60, y: 100 }} />
      <Circle fill="#E8C97A0A" frame={{ width: 80, height: 80 }} blur={40} offset={{ x: 80, y: 140 }} />
    </ZStack>
  );
}

function GlassCard({ children, borderColor, padding: pad }: { children: any; borderColor?: string; padding?: number }) {
  const bColor = borderColor || '#A78BFA40';
  const p = pad ?? 12;
  return (
    <ZStack>
      <RoundedRectangle fill={C.surface} cornerRadius={14} />
      <RoundedRectangle cornerRadius={14} stroke={bColor} strokeWidth={0.5} />
      <VStack padding={p} alignment="leading" spacing={4}>
        {children}
      </VStack>
    </ZStack>
  );
}

function StatusPill({ pace, urgency }: { pace: string; urgency: string }) {
  const accent = accentForPace(pace);
  const label = paceLabel(pace);
  return (
    <ZStack>
      <RoundedRectangle fill={accent + '25'} cornerRadius={10} />
      <RoundedRectangle cornerRadius={10} stroke={accent + C.pillBorderAlpha} strokeWidth={1} />
      <HStack padding={{ top: 4, bottom: 4, leading: 10, trailing: 10 }}>
        <Text font={{ size: 10, weight: 'bold', design: 'default' }} foregroundStyle={accent}>
          {label}
        </Text>
      </HStack>
    </ZStack>
  );
}

function SectionLabel({ text, color }: { text: string; color?: string }) {
  return (
    <Text
      font={{ size: 9, weight: 'semibold', design: 'default' }}
      foregroundStyle={color || C.textMuted}
    >
      {text}
    </Text>
  );
}

function BarChart({ daily, pace, barHeight: maxBarH }: { daily: any[]; pace: string; barHeight: number }) {
  const accent = accentForPace(pace);
  const maxHours = Math.max(...daily.map((d: any) => d.hours || 0), 8);

  return (
    <VStack spacing={4}>
      <HStack spacing={4} alignment="bottom">
        {daily.map((entry: any, i: number) => {
          const h = entry.hours > 0 ? Math.max((entry.hours / maxHours) * maxBarH, 3) : 3;
          let barColor = C.barPast;
          if (entry.isFuture) barColor = C.barFuture;
          if (entry.isToday) barColor = accent;

          return (
            <VStack key={i} spacing={2} alignment="center">
              <RoundedRectangle
                fill={barColor}
                cornerRadius={3}
                frame={{ width: 18, height: h }}
              />
              <Text
                font={{ size: 8, weight: 'medium', design: 'default' }}
                foregroundStyle={entry.isToday ? accent : C.textMuted}
              >
                {entry.day.substring(0, 3)}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    </VStack>
  );
}

// ─── SMALL WIDGET ──────────────────────────────────────────────────
function SmallWidget({ data }: { data: any }) {
  const accent = accentForPace(data.paceBadge);

  return (
    <ZStack>
      <AmbientBackground pace={data.paceBadge} size="small" />
      <VStack padding={14} spacing={8} alignment="leading">
        {/* Hours hero */}
        <VStack spacing={1} alignment="leading">
          <Text
            font={{ size: 32, weight: 'heavy', design: 'default' }}
            foregroundStyle={accent}
          >
            {data.hoursDisplay}
          </Text>
          <SectionLabel text="THIS WEEK" />
        </VStack>

        <Spacer />

        {/* Earnings */}
        <HStack spacing={4} alignment="center">
          <Text
            font={{ size: 18, weight: 'bold', design: 'default' }}
            foregroundStyle={C.gold}
          >
            {data.earnings}
          </Text>
          <Spacer />
          <StatusPill pace={data.paceBadge} urgency={data.urgency} />
        </HStack>

        {/* Remaining */}
        <Text
          font={{ size: 10, weight: 'regular', design: 'monospaced' }}
          foregroundStyle={C.textSecondary}
        >
          {data.hoursRemaining}
        </Text>
      </VStack>
    </ZStack>
  );
}

// ─── MEDIUM WIDGET ─────────────────────────────────────────────────
function MediumWidget({ data }: { data: any }) {
  const accent = accentForPace(data.paceBadge);

  return (
    <ZStack>
      <AmbientBackground pace={data.paceBadge} size="medium" />
      <VStack padding={14} spacing={8}>
        {/* Top row: Hours card + Earnings card */}
        <HStack spacing={8}>
          {/* Hours Glass Card */}
          <GlassCard borderColor={accent + '40'} padding={10}>
            <Text
              font={{ size: 28, weight: 'heavy', design: 'default' }}
              foregroundStyle={accent}
            >
              {data.hoursDisplay}
            </Text>
            <SectionLabel text="THIS WEEK" />
          </GlassCard>

          {/* Earnings Glass Card */}
          <GlassCard borderColor={C.gold + '30'} padding={10}>
            <Text
              font={{ size: 24, weight: 'bold', design: 'default' }}
              foregroundStyle={C.gold}
            >
              {data.earnings}
            </Text>
            <SectionLabel text="EARNED" />
          </GlassCard>
        </HStack>

        {/* Status row */}
        <HStack spacing={6} alignment="center">
          {/* Progress bar background */}
          <ZStack>
            <RoundedRectangle fill={C.border} cornerRadius={6} frame={{ height: 22 }} />
            <RoundedRectangle fill={accent + '30'} cornerRadius={6} frame={{ height: 22 }} />
            <RoundedRectangle cornerRadius={6} stroke={accent + '50'} strokeWidth={0.5} frame={{ height: 22 }} />
            <HStack>
              <Text
                font={{ size: 10, weight: 'bold', design: 'default' }}
                foregroundStyle={accent}
                padding={{ leading: 10 }}
              >
                {paceLabel(data.paceBadge)}
              </Text>
              <Spacer />
            </HStack>
          </ZStack>
          <Text
            font={{ size: 10, weight: 'medium', design: 'monospaced' }}
            foregroundStyle={C.textSecondary}
          >
            {data.hoursRemaining}
          </Text>
        </HStack>

        {/* Bottom row: Activity + Metrics */}
        <HStack spacing={6} alignment="center">
          {/* Mini bar chart */}
          <SectionLabel text="ACTIVITY" />
          <Spacer />
          <Text
            font={{ size: 10, weight: 'regular', design: 'monospaced' }}
            foregroundStyle={C.textSecondary}
          >
            Today: {data.today}
          </Text>
          <Text
            font={{ size: 10, weight: 'regular', design: 'monospaced' }}
            foregroundStyle={C.textMuted}
          >
            ·
          </Text>
          <Text
            font={{ size: 10, weight: 'regular', design: 'monospaced' }}
            foregroundStyle={C.cyan}
          >
            AI: {data.aiPct}
          </Text>
        </HStack>

        {/* Bar chart row */}
        {data.daily && data.daily.length > 0 && (
          <BarChart daily={data.daily} pace={data.paceBadge} barHeight={28} />
        )}
      </VStack>
    </ZStack>
  );
}

// ─── LARGE WIDGET ──────────────────────────────────────────────────
function LargeWidget({ data }: { data: any }) {
  const accent = accentForPace(data.paceBadge);

  return (
    <ZStack>
      <AmbientBackground pace={data.paceBadge} size="large" />
      <VStack padding={16} spacing={10} alignment="leading">
        {/* ── Header: Hours hero + Status ── */}
        <HStack spacing={10}>
          <GlassCard borderColor={accent + '40'} padding={12}>
            <SectionLabel text="THIS WEEK" color={accent + 'AA'} />
            <Text
              font={{ size: 36, weight: 'heavy', design: 'default' }}
              foregroundStyle={accent}
            >
              {data.hoursDisplay}
            </Text>
            <Text
              font={{ size: 11, weight: 'regular', design: 'monospaced' }}
              foregroundStyle={C.textSecondary}
            >
              of 40h goal
            </Text>
            <StatusPill pace={data.paceBadge} urgency={data.urgency} />
          </GlassCard>

          <VStack spacing={8} alignment="leading">
            {/* Earnings card */}
            <GlassCard borderColor={C.gold + '25'} padding={10}>
              <SectionLabel text="EARNINGS" />
              <Text
                font={{ size: 26, weight: 'bold', design: 'default' }}
                foregroundStyle={C.gold}
              >
                {data.earnings}
              </Text>
            </GlassCard>

            {/* Today + Remaining mini cards */}
            <HStack spacing={6}>
              <GlassCard borderColor={C.border} padding={8}>
                <SectionLabel text="TODAY" />
                <Text
                  font={{ size: 16, weight: 'bold', design: 'monospaced' }}
                  foregroundStyle={C.textPrimary}
                >
                  {data.today}
                </Text>
              </GlassCard>
              <GlassCard borderColor={C.border} padding={8}>
                <SectionLabel text="REMAINING" />
                <Text
                  font={{ size: 16, weight: 'bold', design: 'monospaced' }}
                  foregroundStyle={C.textSecondary}
                >
                  {data.hoursRemaining}
                </Text>
              </GlassCard>
            </HStack>
          </VStack>
        </HStack>

        {/* ── Activity Bar Chart ── */}
        <GlassCard borderColor={accent + '20'} padding={12}>
          <SectionLabel text="ACTIVITY" />
          {data.daily && data.daily.length > 0 && (
            <BarChart daily={data.daily} pace={data.paceBadge} barHeight={50} />
          )}
        </GlassCard>

        {/* ── Metrics Row: AI + BrainLift ── */}
        <HStack spacing={8}>
          <GlassCard borderColor={C.cyan + '25'} padding={10}>
            <SectionLabel text="AI TRAJECTORY" color={C.cyan + '90'} />
            <Text
              font={{ size: 22, weight: 'heavy', design: 'monospaced' }}
              foregroundStyle={C.cyan}
            >
              {data.aiPct}
            </Text>
            <Text
              font={{ size: 9, weight: 'regular', design: 'default' }}
              foregroundStyle={C.textMuted}
            >
              weekly range
            </Text>
          </GlassCard>

          <GlassCard borderColor={C.violet + '25'} padding={10}>
            <SectionLabel text="BRAINLIFT" color={C.violet + '90'} />
            <Text
              font={{ size: 22, weight: 'heavy', design: 'monospaced' }}
              foregroundStyle={C.violet}
            >
              {data.brainlift}
            </Text>
            <Text
              font={{ size: 9, weight: 'regular', design: 'default' }}
              foregroundStyle={C.textMuted}
            >
              deep work
            </Text>
          </GlassCard>

          {data.isManager && data.pendingCount > 0 && (
            <GlassCard borderColor={C.warning + '25'} padding={10}>
              <SectionLabel text="APPROVALS" color={C.warning + '90'} />
              <Text
                font={{ size: 22, weight: 'heavy', design: 'default' }}
                foregroundStyle={C.warning}
              >
                {String(data.pendingCount)}
              </Text>
              <Text
                font={{ size: 9, weight: 'regular', design: 'default' }}
                foregroundStyle={C.textMuted}
              >
                pending
              </Text>
            </GlassCard>
          )}
        </HStack>

        {/* ── Footer: Today delta + cached ── */}
        <HStack spacing={4} alignment="center">
          <Text
            font={{ size: 10, weight: 'medium', design: 'monospaced' }}
            foregroundStyle={C.textMuted}
          >
            Today: {data.todayDelta}
          </Text>
          <Spacer />
          {data.weekDeltaEarnings && (
            <Text
              font={{ size: 10, weight: 'medium', design: 'monospaced' }}
              foregroundStyle={C.gold + 'AA'}
            >
              {data.weekDeltaEarnings}
            </Text>
          )}
        </HStack>
      </VStack>
    </ZStack>
  );
}

// ─── Default Data (fallback) ───────────────────────────────────────
const DEFAULT_DATA = {
  hoursDisplay: '22.3h',
  earnings: '$1,117',
  hoursRemaining: '17.7h left',
  paceBadge: 'on_track' as const,
  urgency: 'none' as const,
  aiPct: '74%–78%',
  brainlift: '3.2h',
  today: '+5.0h',
  todayDelta: '+0.0h',
  weekDeltaEarnings: '+$112',
  pendingCount: 0,
  isManager: false,
  daily: [
    { day: 'Mon', hours: 6.5, isToday: false, isFuture: false },
    { day: 'Tue', hours: 7.2, isToday: false, isFuture: false },
    { day: 'Wed', hours: 5.0, isToday: true, isFuture: false },
    { day: 'Thu', hours: 3.6, isToday: false, isFuture: false },
    { day: 'Fri', hours: 0, isToday: false, isFuture: true },
    { day: 'Sat', hours: 0, isToday: false, isFuture: true },
    { day: 'Sun', hours: 0, isToday: false, isFuture: true },
  ],
  cachedAt: Date.now(),
  approvalItems: [],
};

// ─── Widget Entry Point ────────────────────────────────────────────
const HourglassWidget = createWidget((props: any) => {
  'widget';

  const widgetFamily: string = props?.widgetFamily || 'systemMedium';
  const data = props?.data || DEFAULT_DATA;

  if (widgetFamily === 'systemSmall') {
    return <SmallWidget data={data} />;
  }

  if (widgetFamily === 'systemLarge') {
    return <LargeWidget data={data} />;
  }

  // Default: systemMedium
  return <MediumWidget data={data} />;
});

export default HourglassWidget;
```
