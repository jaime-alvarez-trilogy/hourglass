```tsx
'widget';
const { VStack, HStack, ZStack, Text, Spacer, Rectangle, RoundedRectangle, Circle } = require('@expo/ui/swift-ui');
const { createWidget } = require('expo-widgets');

/**
 * Hourglass iOS Widget
 * Implements Spatial Dark Glass UI
 */
export default createWidget((props) => {
  const family = props.widgetFamily || 'systemLarge';

  // Data Extraction & Fallbacks
  const hoursDisplay = props.hoursDisplay || '0.0h';
  const earnings = props.earnings || '$0';
  const hoursRemaining = props.hoursRemaining || '0.0h left';
  const paceBadge = props.paceBadge || 'on_track';
  const aiPct = props.aiPct || '0%';
  const todayDelta = props.todayDelta || '+0.0h';
  
  const defaultDaily = [
    { day: 'Mon', hours: 4.2, isToday: false, isFuture: false },
    { day: 'Tue', hours: 8.1, isToday: false, isFuture: false },
    { day: 'Wed', hours: 5.0, isToday: true, isFuture: false },
    { day: 'Thu', hours: 0, isToday: false, isFuture: true },
    { day: 'Fri', hours: 0, isToday: false, isFuture: true },
    { day: 'Sat', hours: 0, isToday: false, isFuture: true },
    { day: 'Sun', hours: 0, isToday: false, isFuture: true },
  ];
  const daily = (props.daily && props.daily.length > 0) ? props.daily : defaultDaily;

  // Theme & Status Mapping
  let accentColor = '#10B981'; // Success Green (Default/On Track)
  let paceLabel = 'ON TRACK';
  
  if (paceBadge === 'crushed_it') {
    accentColor = '#FFDF89'; // Gold Peak
    paceLabel = 'CRUSHED IT';
  } else if (paceBadge === 'behind' || paceBadge === 'low') {
    accentColor = '#F59E0B'; // Warning Orange
    paceLabel = 'BEHIND PACE';
  } else if (paceBadge === 'critical' || paceBadge === 'high') {
    accentColor = '#F43F5E'; // Critical Red
    paceLabel = 'CRITICAL';
  }

  // Common UI Components
  const AmbientBackground = () => (
    <ZStack>
      <Rectangle fill="#0D0C14" />
      <VStack>
        <HStack>
          <Spacer />
          <Circle fill={accentColor + '25'} blur={60} />
        </HStack>
        <Spacer />
      </VStack>
      <VStack>
        <Spacer />
        <HStack>
          <Circle fill="#A78BFA20" blur={70} />
          <Spacer />
        </HStack>
      </VStack>
    </ZStack>
  );

  const GlassCard = ({ children, padding = 14 }) => (
    <ZStack>
      <RoundedRectangle fill="#16151FCC" cornerRadius={16} />
      <RoundedRectangle cornerRadius={16} stroke="#2F2E41" strokeWidth={1} />
      <VStack padding={padding} alignment="leading" spacing={4}>
        {children}
      </VStack>
    </ZStack>
  );

  const StatPill = () => (
    <ZStack padding={{ top: 4, bottom: 4, leading: 10, trailing: 10 }}>
      <RoundedRectangle fill={accentColor + '20'} cornerRadius={12} stroke={accentColor + '80'} strokeWidth={1} />
      <Text font={{ size: 10, weight: 'bold', design: 'default' }} foregroundStyle={accentColor}>
        {paceLabel}
      </Text>
    </ZStack>
  );

  const BarChart = () => {
    const maxHours = Math.max(8, ...daily.map(d => d.hours || 0));
    const maxHeight = 44;

    return (
      <HStack alignment="bottom" spacing={8}>
        {daily.map((day, index) => {
          const h = Math.max(4, ((day.hours || 0) / maxHours) * maxHeight);
          const barColor = day.isToday ? accentColor : (day.isFuture ? '#2F2E41' : '#4A4A6A');
          
          return (
            <VStack key={day.day || index.toString()} alignment="center" spacing={6}>
              <Spacer />
              <RoundedRectangle 
                cornerRadius={4} 
                fill={barColor} 
                frame={{ width: 20, height: h }} 
              />
              <Text font={{ size: 10, weight: 'medium', design: 'default' }} foregroundStyle="#757575">
                {day.day ? day.day.substring(0, 3) : ''}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    );
  };

  // ---------------------------------------------------------------------------
  // WIDGET SIZES
  // ---------------------------------------------------------------------------

  if (family === 'systemSmall') {
    return (
      <ZStack>
        <AmbientBackground />
        <VStack padding={16} alignment="leading" spacing={8}>
          <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
            THIS WEEK
          </Text>
          <Text font={{ size: 32, weight: 'heavy', design: 'default' }} foregroundStyle={accentColor}>
            {hoursDisplay}
          </Text>
          <Spacer />
          <StatPill />
          <HStack spacing={4} padding={{ top: 4 }}>
            <Text font={{ size: 12, weight: 'medium', design: 'default' }} foregroundStyle="#A0A0A0">
              Earned:
            </Text>
            <Text font={{ size: 12, weight: 'bold', design: 'monospaced' }} foregroundStyle="#E8C97A">
              {earnings}
            </Text>
          </HStack>
        </VStack>
      </ZStack>
    );
  }

  if (family === 'systemMedium') {
    return (
      <ZStack>
        <AmbientBackground />
        <VStack padding={16} spacing={12}>
          <HStack spacing={12}>
            <GlassCard>
              <Text font={{ size: 10, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
                THIS WEEK
              </Text>
              <Text font={{ size: 28, weight: 'heavy', design: 'default' }} foregroundStyle={accentColor}>
                {hoursDisplay}
              </Text>
            </GlassCard>
            <GlassCard>
              <Text font={{ size: 10, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
                EARNINGS
              </Text>
              <Text font={{ size: 28, weight: 'heavy', design: 'default' }} foregroundStyle="#E8C97A">
                {earnings}
              </Text>
            </GlassCard>
          </HStack>
          
          <HStack alignment="center">
            <StatPill />
            <Spacer />
            <Text font={{ size: 12, weight: 'medium', design: 'monospaced' }} foregroundStyle="#A0A0A0">
              AI: 
            </Text>
            <Text font={{ size: 12, weight: 'bold', design: 'monospaced' }} foregroundStyle="#00C2FF">
              {' ' + aiPct}
            </Text>
            <Text font={{ size: 12, weight: 'medium', design: 'monospaced' }} foregroundStyle="#757575">
              {'  •  '}Today: 
            </Text>
            <Text font={{ size: 12, weight: 'bold', design: 'monospaced' }} foregroundStyle="#E0E0E0">
              {' ' + todayDelta}
            </Text>
          </HStack>
        </VStack>
      </ZStack>
    );
  }

  // Default to systemLarge
  return (
    <ZStack>
      <AmbientBackground />
      <VStack padding={16} spacing={12} alignment="leading">
        
        {/* Top Row: Core Metrics */}
        <HStack spacing={12}>
          <GlassCard>
            <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              THIS WEEK
            </Text>
            <Text font={{ size: 30, weight: 'heavy', design: 'default' }} foregroundStyle={accentColor}>
              {hoursDisplay}
            </Text>
          </GlassCard>
          <GlassCard>
            <Text font={{ size: 11, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              EARNINGS
            </Text>
            <Text font={{ size: 30, weight: 'heavy', design: 'default' }} foregroundStyle="#E8C97A">
              {earnings}
            </Text>
          </GlassCard>
        </HStack>

        {/* Middle Row: Status & Remaining */}
        <HStack alignment="center">
          <StatPill />
          <Spacer />
          <Text font={{ size: 13, weight: 'medium', design: 'monospaced' }} foregroundStyle="#A0A0A0">
            {hoursRemaining}
          </Text>
        </HStack>

        {/* Bottom Row: Activity Panel */}
        <GlassCard padding={12}>
          <Text font={{ size: 10, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
            ACTIVITY
          </Text>
          
          <VStack padding={{ top: 8, bottom: 8 }}>
            <BarChart />
          </VStack>

          <HStack alignment="center">
            <Text font={{ size: 11, weight: 'medium', design: 'monospaced' }} foregroundStyle="#757575">
              Today:
            </Text>
            <Text font={{ size: 11, weight: 'bold', design: 'monospaced' }} foregroundStyle="#E0E0E0">
              {' ' + todayDelta}
            </Text>
            <Spacer />
            <Text font={{ size: 11, weight: 'medium', design: 'monospaced' }} foregroundStyle="#757575">
              AI Trajectory:
            </Text>
            <Text font={{ size: 11, weight: 'bold', design: 'monospaced' }} foregroundStyle="#00C2FF">
              {' ' + aiPct}
            </Text>
          </HStack>
        </GlassCard>

      </VStack>
    </ZStack>
  );
});
```
