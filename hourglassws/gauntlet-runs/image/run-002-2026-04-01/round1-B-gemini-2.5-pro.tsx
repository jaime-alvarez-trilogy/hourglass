```tsx
import {
  WidgetData,
  WidgetDailyEntry,
  WidgetPaceBadge,
} from './widget-data'; // Assuming types are defined here for TS support

const { createWidget } = require('expo-widgets');
const {
  VStack,
  HStack,
  ZStack,
  Text,
  Spacer,
  Rectangle,
  RoundedRectangle,
  Circle,
} = require('@expo/ui/swift-ui');

// --- DESIGN SYSTEM CONSTANTS ---

const COLORS = {
  background: '#0D0C14',
  surface: '#16151FCC', // 80% opacity
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
};

const FONTS = {
  hero: { size: 36, weight: 'heavy', design: 'default' }, // Space Grotesk Bold
  metric: { size: 24, weight: 'heavy', design: 'default' }, // Space Grotesk Bold
  label: { size: 10, weight: 'semibold', design: 'default' }, // Inter Medium
  data: { size: 12, weight: 'regular', design: 'monospaced' }, // Space Mono
  pill: { size: 10, weight: 'bold', design: 'default' }, // Inter
  barLabel: { size: 10, weight: 'regular', design: 'monospaced' }, // Space Mono
};

// --- HELPER FUNCTIONS ---

const getPaceInfo = (paceBadge?: WidgetPaceBadge) => {
  switch (paceBadge) {
    case 'on_track':
      return { color: COLORS.success, text: 'ON TRACK' };
    case 'crushed_it':
      return { color: COLORS.goldBright, text: 'CRUSHED IT' };
    case 'behind':
      return { color: COLORS.warning, text: 'BEHIND' };
    case 'critical':
      return { color: COLORS.critical, text: 'CRITICAL' };
    default:
      return { color: COLORS.success, text: 'ON TRACK' };
  }
};

// --- REUSABLE COMPONENT-LIKE FUNCTIONS ---

const BackgroundGlow = ({ paceBadge }: { paceBadge?: WidgetPaceBadge }) => {
  const paceColor = getPaceInfo(paceBadge).color;
  const isDefault =
    paceBadge !== 'behind' && paceBadge !== 'critical' && paceBadge !== 'crushed_it';

  if (isDefault) {
    return (
      <>
        <Circle fill={COLORS.violet} blur={100} x={-50} y={-50} />
        <Circle fill={COLORS.cyan} blur={100} x={150} y={100} />
      </>
    );
  }

  return (
    <>
      <Circle fill={paceColor} blur={120} x={-50} y={-50} />
      <Circle fill={paceColor} blur={120} x={150} y={100} opacity={0.6} />
    </>
  );
};

const GlassCard = ({
  children,
  accentColor,
  padding = 14,
}: {
  children: React.ReactNode;
  accentColor: string;
  padding?: number;
}) => (
  <ZStack>
    <RoundedRectangle fill={COLORS.surface} cornerRadius={16} />
    <RoundedRectangle
      cornerRadius={16}
      stroke={`${accentColor}40`} // 25% opacity
      strokeWidth={1}
    />
    <VStack padding={padding} alignment="leading" spacing={4}>
      {children}
    </VStack>
  </ZStack>
);

const MetricView = ({
  value,
  label,
  valueColor = COLORS.textPrimary,
  font = FONTS.metric,
  alignment = 'leading',
}: {
  value: string;
  label: string;
  valueColor?: string;
  font?: any;
  alignment?: 'leading' | 'center' | 'trailing';
}) => (
  <VStack alignment={alignment} spacing={2}>
    <Text font={font} color={valueColor}>
      {value}
    </Text>
    <Text font={FONTS.label} color={COLORS.textSecondary}>
      {label}
    </Text>
  </VStack>
);

const StatusPill = ({ paceBadge }: { paceBadge?: WidgetPaceBadge }) => {
  const { color, text } = getPaceInfo(paceBadge);
  return (
    <ZStack alignment="center">
      <RoundedRectangle fill={color} cornerRadius={100} />
      <Text
        font={FONTS.pill}
        color={paceBadge === 'crushed_it' ? '#000000' : '#FFFFFF'}
        padding={{ horizontal: 8, vertical: 4 }}
      >
        {text}
      </Text>
    </ZStack>
  );
};

const Bar = ({
  day,
  maxHours,
  accentColor,
}: {
  day: WidgetDailyEntry;
  maxHours: number;
  accentColor: string;
}) => {
  const MAX_BAR_HEIGHT = 50;
  const barHeight =
    maxHours > 0
      ? Math.max(2, (day.hours / maxHours) * MAX_BAR_HEIGHT)
      : 2;

  let barColor = COLORS.barPast;
  if (day.isToday) {
    barColor = accentColor;
  } else if (day.isFuture) {
    barColor = COLORS.barFuture;
  }

  return (
    <VStack alignment="center" spacing={6}>
      <VStack alignment="center">
        <Spacer minLength={MAX_BAR_HEIGHT - barHeight} />
        <RoundedRectangle
          fill={barColor}
          cornerRadius={4}
          height={barHeight}
          width={18}
        />
      </VStack>
      <Text font={FONTS.barLabel} color={COLORS.textMuted}>
        {day.day.toUpperCase()}
      </Text>
    </VStack>
  );
};

const BarChart = ({
  daily,
  accentColor,
}: {
  daily: WidgetDailyEntry[];
  accentColor: string;
}) => {
  const maxHours = Math.max(...daily.map((d) => d.hours), 1); // Avoid division by zero, ensure at least 1
  return (
    <HStack spacing={12} alignment="bottom">
      {daily.slice(0, 7).map((day) => (
        <Bar
          key={day.day}
          day={day}
          maxHours={maxHours}
          accentColor={accentColor}
        />
      ))}
    </HStack>
  );
};

// --- WIDGET SIZE IMPLEMENTATIONS ---

const SmallWidget = ({ data }: { data: WidgetData }) => {
  const paceColor = getPaceInfo(data.paceBadge).color;
  return (
    <ZStack alignment="topLeading">
      <Rectangle fill={COLORS.background} />
      <BackgroundGlow paceBadge={data.paceBadge} />
      <VStack padding={16} spacing={0} alignment="leading">
        <Text font={FONTS.hero} color={paceColor}>
          {data.hoursDisplay}
        </Text>
        <Text font={FONTS.label} color={COLORS.textSecondary}>
          THIS WEEK
        </Text>
        <Spacer />
        <HStack alignment="center">
          <StatusPill paceBadge={data.paceBadge} />
          <Spacer />
          <Text font={FONTS.data} color={COLORS.textSecondary}>
            {data.hoursRemaining}
          </Text>
        </HStack>
      </VStack>
    </ZStack>
  );
};

const MediumWidget = ({ data }: { data: WidgetData }) => {
  const paceColor = getPaceInfo(data.paceBadge).color;
  return (
    <ZStack alignment="topLeading">
      <Rectangle fill={COLORS.background} />
      <BackgroundGlow paceBadge={data.paceBadge} />
      <VStack padding={16} spacing={12} alignment="leading">
        <HStack spacing={12}>
          <GlassCard accentColor={paceColor}>
            <MetricView
              value={data.hoursDisplay}
              label="THIS WEEK"
              valueColor={paceColor}
            />
          </GlassCard>
          <GlassCard accentColor={COLORS.gold}>
            <MetricView
              value={data.earnings}
              label="EARNED"
              valueColor={COLORS.gold}
            />
          </GlassCard>
        </HStack>
        <Spacer />
        <HStack alignment="center">
          <StatusPill paceBadge={data.paceBadge} />
          <Spacer />
          <Text font={FONTS.data} color={COLORS.textSecondary}>
            {`${data.today} / ${data.hoursRemaining}`}
          </Text>
        </HStack>
      </VStack>
    </ZStack>
  );
};

const LargeWidget = ({ data }: { data: WidgetData }) => {
  const paceColor = getPaceInfo(data.paceBadge).color;
  return (
    <ZStack alignment="topLeading">
      <Rectangle fill={COLORS.background} />
      <BackgroundGlow paceBadge={data.paceBadge} />
      <VStack padding={16} spacing={12} alignment="leading">
        <HStack spacing={12}>
          <MetricView
            value={data.hoursDisplay}
            label="THIS WEEK"
            valueColor={paceColor}
            font={FONTS.metric}
          />
          <Spacer />
          <MetricView
            value={data.earnings}
            label="EARNED"
            valueColor={COLORS.gold}
            font={FONTS.metric}
            alignment="trailing"
          />
        </HStack>

        <GlassCard accentColor={paceColor} padding={16}>
          <BarChart daily={data.daily} accentColor={paceColor} />
        </GlassCard>

        <HStack>
          <MetricView
            value={data.brainlift}
            label="BRAINLIFT"
            valueColor={COLORS.violet}
            font={FONTS.data}
          />
          <Spacer />
          <MetricView
            value={data.aiPct}
            label="AI %"
            valueColor={COLORS.cyan}
            font={FONTS.data}
            alignment="trailing"
          />
        </HStack>

        <Spacer minLength={0}/>

        <HStack alignment="center">
          <StatusPill paceBadge={data.paceBadge} />
          <Spacer />
          <Text font={FONTS.data} color={COLORS.textSecondary}>
            Today: {data.todayDelta}
          </Text>
        </HStack>
      </VStack>
    </ZStack>
  );
};

// --- WIDGET DEFINITION ---

const HourglassWidget = createWidget<{
  family: 'systemSmall' | 'systemMedium' | 'systemLarge';
  data: WidgetData;
}>(({ family, data }) => {
  // This directive is required for expo-widgets
  'widget';

  // Fallback data for previewing in Expo Go or when data is missing
  const defaultData: WidgetData = {
    hoursDisplay: '22.3h',
    earnings: '$1,117',
    hoursRemaining: '17.7h left',
    paceBadge: 'on_track',
    urgency: 'none',
    aiPct: '74%-78%',
    brainlift: '3.2h',
    today: '+5.0h',
    todayDelta: '+0.2h',
    weekDeltaEarnings: '+$100',
    pendingCount: 2,
    isManager: false,
    daily: [
      { day: 'Mon', hours: 4, isToday: false, isFuture: false },
      { day: 'Tue', hours: 8, isToday: false, isFuture: false },
      { day: 'Wed', hours: 5, isToday: true, isFuture: false },
      { day: 'Thu', hours: 0, isToday: false, isFuture: true },
      { day: 'Fri', hours: 0, isToday: false, isFuture: true },
      { day: 'Sat', hours: 0, isToday: false, isFuture: true },
      { day: 'Sun', hours: 0, isToday: false, isFuture: true },
    ],
    cachedAt: Date.now(),
    approvalItems: [],
  };

  const displayData = data || defaultData;

  switch (family) {
    case 'systemLarge':
      return <LargeWidget data={displayData} />;
    case 'systemMedium':
      return <MediumWidget data={displayData} />;
    default:
      return <SmallWidget data={displayData} />;
  }
});

export default HourglassWidget;
```
