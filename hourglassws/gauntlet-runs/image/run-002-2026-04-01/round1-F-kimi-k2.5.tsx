```tsx
const { createWidget } = require('expo-widgets');
const { VStack, HStack, ZStack, Text, Spacer, Rectangle, RoundedRectangle, Circle } = require('@expo/ui/swift-ui');

interface WidgetDailyEntry {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  hours: number;
  isToday: boolean;
  isFuture: boolean;
}

interface WidgetData {
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
  approvalItems: Array<{id: string; name: string; hours: number; category: string}>;
}

const getAccentColor = (paceBadge: string, urgency: string): string => {
  if (paceBadge === 'crushed_it') return '#FFDF89';
  if (paceBadge === 'critical') return '#F43F5E';
  if (paceBadge === 'behind') return '#F59E0B';
  if (urgency === 'critical' || urgency === 'high') return '#F43F5E';
  if (urgency === 'low') return '#F59E0B';
  return '#10B981';
};

const GlassCard = ({ children, glowColor }: { children: any; glowColor?: string }) => (
  <ZStack>
    {glowColor && (
      <Circle
        fill={glowColor}
        blur={25}
        opacity={0.15}
        frame={{ width: 60, height: 60 }}
      />
    )}
    <RoundedRectangle fill="#16151FCC" cornerRadius={16} />
    <RoundedRectangle cornerRadius={16} stroke="#A78BFA40" strokeWidth={1} />
    <VStack padding={12} alignment="leading" spacing={6}>
      {children}
    </VStack>
  </ZStack>
);

const StatusPill = ({ status, color }: { status: string; color: string }) => (
  <ZStack>
    <RoundedRectangle fill={`${color}20`} cornerRadius={12} stroke={color} strokeWidth={1} />
    <Text
      font={{ size: 10, weight: 'semibold', design: 'default' }}
      foregroundStyle={color}
      padding={{ horizontal: 8, vertical: 4 }}
    >
      {status.replace('_', ' ').toUpperCase()}
    </Text>
  </ZStack>
);

const SmallWidget = ({ data }: { data: WidgetData }) => {
  const accentColor = getAccentColor(data.paceBadge, data.urgency);
  
  return (
    <ZStack>
      <Rectangle fill="#0D0C14" />
      <Circle fill={accentColor} blur={35} opacity={0.2} />
      
      <VStack padding={16} alignment="leading" spacing={4}>
        <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
          THIS WEEK
        </Text>
        <Text font={{ size: 32, weight: 'heavy', design: 'default' }} foregroundStyle="#E0E0E0">
          {data.hoursDisplay}
        </Text>
        <Spacer />
        <HStack spacing={6} alignment="center">
          <Circle fill={accentColor} frame={{ width: 6, height: 6 }} />
          <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle={accentColor}>
            {data.paceBadge.replace('_', ' ').toUpperCase()}
          </Text>
        </HStack>
      </VStack>
    </ZStack>
  );
};

const MediumWidget = ({ data }: { data: WidgetData }) => {
  const accentColor = getAccentColor(data.paceBadge, data.urgency);
  
  return (
    <ZStack>
      <Rectangle fill="#0D0C14" />
      <Circle fill="#A78BFA" blur={45} opacity={0.1} />
      <Circle fill={accentColor} blur={40} opacity={0.15} />
      
      <HStack padding={14} spacing={10}>
        <VStack spacing={10} frame={{ flex: 1 }}>
          <GlassCard glowColor={accentColor}>
            <Text font={{ size: 10, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              THIS WEEK
            </Text>
            <Text font={{ size: 28, weight: 'heavy', design: 'default' }} foregroundStyle="#E0E0E0">
              {data.hoursDisplay}
            </Text>
            <Spacer />
            <StatusPill status={data.paceBadge} color={accentColor} />
          </GlassCard>
          
          <HStack spacing={8}>
            <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle="#00C2FF">
              AI {data.aiPct}
            </Text>
          </HStack>
        </VStack>
        
        <VStack spacing={10} frame={{ flex: 1 }}>
          <GlassCard glowColor="#E8C97A">
            <Text font={{ size: 10, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              EARNED
            </Text>
            <Text font={{ size: 28, weight: 'heavy', design: 'default' }} foregroundStyle="#E8C97A">
              {data.earnings}
            </Text>
            <Spacer />
            <Text font={{ size: 11, weight: 'medium', design: 'default' }} foregroundStyle="#757575">
              {data.hoursRemaining}
            </Text>
          </GlassCard>
          
          <HStack spacing={8}>
            <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle="#A78BFA">
              BRAINLIFT
            </Text>
            <Text font={{ size: 11, weight: 'bold', design: 'monospaced' }} foregroundStyle="#E0E0E0">
              {data.brainlift}
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </ZStack>
  );
};

const LargeWidget = ({ data }: { data: WidgetData }) => {
  const accentColor = getAccentColor(data.paceBadge, data.urgency);
  const maxHours = Math.max(...data.daily.map(d => d.hours), 8);
  
  return (
    <ZStack>
      <Rectangle fill="#0D0C14" />
      <Circle fill="#A78BFA" blur={50} opacity={0.12} />
      <Circle fill={accentColor} blur={45} opacity={0.18} />
      <Circle fill="#00C2FF" blur={40} opacity={0.1} />
      
      <VStack padding={16} spacing={12}>
        <HStack spacing={12}>
          <GlassCard glowColor={accentColor} frame={{ flex: 1 }}>
            <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              THIS WEEK
            </Text>
            <Text font={{ size: 34, weight: 'heavy', design: 'default' }} foregroundStyle="#E0E0E0">
              {data.hoursDisplay}
            </Text>
            <Text font={{ size: 12, weight: 'medium', design: 'default' }} foregroundStyle="#757575">
              {data.hoursRemaining}
            </Text>
            <Spacer />
            <StatusPill status={data.paceBadge} color={accentColor} />
          </GlassCard>
          
          <GlassCard glowColor="#E8C97A" frame={{ flex: 1 }}>
            <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              EARNINGS
            </Text>
            <Text font={{ size: 34, weight: 'heavy', design: 'default' }} foregroundStyle="#E8C97A">
              {data.earnings}
            </Text>
            <Text font={{ size: 12, weight: 'medium', design: 'default' }} foregroundStyle="#757575">
              this week
            </Text>
            <Spacer />
            <HStack spacing={12}>
              <VStack alignment="leading" spacing={2}>
                <Text font={{ size: 10, weight: 'semibold', design: 'default' }} foregroundStyle="#00C2FF">
                  AI
                </Text>
                <Text font={{ size: 12, weight: 'bold', design: 'monospaced' }} foregroundStyle="#E0E0E0">
                  {data.aiPct}
                </Text>
              </VStack>
              <VStack alignment="leading" spacing={2}>
                <Text font={{ size: 10, weight: 'semibold', design: 'default' }} foregroundStyle="#A78BFA">
                  BRAINLIFT
                </Text>
                <Text font={{ size: 12, weight: 'bold', design: 'monospaced' }} foregroundStyle="#E0E0E0">
                  {data.brainlift}
                </Text>
              </VStack>
            </HStack>
          </GlassCard>
        </HStack>
        
        <GlassCard glowColor={accentColor}>
          <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
            ACTIVITY
          </Text>
          
          <HStack spacing={6} alignment="bottom" frame={{ height: 70 }} padding={{ top: 8 }}>
            {data.daily.map((day, idx) => {
              const barHeight = Math.max((day.hours / maxHours) * 50, 4);
              let barColor = '#4A4A6A';
              if (day.isToday) barColor = accentColor;
              else if (day.isFuture) barColor = '#2F2E41';
              
              return (
                <VStack key={idx} alignment="center" spacing={4} frame={{ flex: 1 }}>
                  <RoundedRectangle 
                    fill={barColor} 
                    cornerRadius={3} 
                    frame={{ width: 24, height: barHeight }} 
                  />
                  <Text 
                    font={{ size: 9, weight: 'medium', design: 'default' }} 
                    foregroundStyle={day.isToday ? accentColor : '#757575'}
                  >
                    {day.day}
                  </Text>
                </VStack>
              );
            })}
          </HStack>
          
          <HStack spacing={16} padding={{ top: 4 }}>
            <HStack spacing={4}>
              <Text font={{ size: 11, weight: 'medium', design: 'default' }} foregroundStyle="#A0A0A0">
                Today:
              </Text>
              <Text font={{ size: 11, weight: 'bold', design: 'monospaced' }} foregroundStyle="#E0E0E0">
                {data.today}
              </Text>
            </HStack>
            <HStack spacing={4}>
              <Text font={{ size: 11, weight: 'medium', design: 'default' }} foregroundStyle="#A0A0A0">
                AI:
              </Text>
              <Text font={{ size: 11, weight: 'bold', design: 'monospaced' }} foregroundStyle="#00C2FF">
                {data.aiPct}
              </Text>
            </HStack>
          </HStack>
        </GlassCard>
      </VStack>
    </ZStack>
  );
};

const HourglassWidget = (props: { widgetFamily: string; data: WidgetData }) => {
  const { widgetFamily, data } = props;
  
  switch (widgetFamily) {
    case 'systemSmall':
      return <SmallWidget data={data} />;
    case 'systemMedium':
      return <MediumWidget data={data} />;
    case 'systemLarge':
      return <LargeWidget data={data} />;
    default:
      return <MediumWidget data={data} />;
  }
};

export default createWidget(HourglassWidget);
```
