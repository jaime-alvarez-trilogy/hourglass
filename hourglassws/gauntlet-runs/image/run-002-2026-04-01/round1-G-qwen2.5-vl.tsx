```tsx
const { VStack, HStack, ZStack, Text, Spacer, Rectangle, RoundedRectangle, Circle } = require('@expo/ui/swift-ui');
const { createWidget } = require('expo-widgets');

const HourglassWidget = createWidget(({ widgetData }) => {
  'widget';

  const { hoursDisplay, earnings, hoursRemaining, paceBadge, urgency, aiPct, brainlift, today, todayDelta, weekDeltaEarnings, daily } = widgetData;

  const paceColor = {
    on_track: '#10B981',
    crushed_it: '#FFDF89',
    behind: '#F59E0B',
    critical: '#F43F5E',
  }[paceBadge] || '#A78BFA';

  const urgencyColor = {
    none: '#10B981',
    low: '#F59E0B',
    high: '#F43F5E',
    critical: '#F43F5E',
    expired: '#757575',
  }[urgency] || '#A78BFA';

  const GlassCard = ({ children }) => (
    <ZStack>
      <RoundedRectangle fill="#16151FCC" cornerRadius={16} />
      <RoundedRectangle cornerRadius={16} stroke="#A78BFA40" strokeWidth={1} />
      <VStack padding={14} alignment="leading">
        {children}
      </VStack>
    </ZStack>
  );

  const StatusPill = ({ text, color }) => (
    <RoundedRectangle
      fill={color}
      cornerRadius={8}
      stroke={color}
      strokeWidth={1}
    >
      <Text
        font={{ size: 10, weight: 'semibold', design: 'default' }}
        foregroundStyle="#E0E0E0"
        padding={4}
      >
        {text.toUpperCase()}
      </Text>
    </RoundedRectangle>
  );

  const BarChart = ({ daily }) => (
    <VStack spacing={4}>
      <HStack spacing={2}>
        {daily.map((day) => (
          <Rectangle
            key={day.day}
            fill={day.isToday ? paceColor : day.isFuture ? '#2F2E41' : '#4A4A6A'}
            width={10}
            height={(day.hours / 40) * 50}
          />
        ))}
      </HStack>
      <HStack spacing={2}>
        {daily.map((day) => (
          <Text
            key={day.day}
            font={{ size: 10, weight: 'medium', design: 'default' }}
            foregroundStyle="#757575"
          >
            {day.day[0]}
          </Text>
        ))}
      </HStack>
    </VStack>
  );

  const SmallWidget = () => (
    <ZStack>
      <Circle fill="#A78BFA40" blur={10} width={100} height={100} />
      <Circle fill="#00C2FF40" blur={10} width={80} height={80} />
      <GlassCard>
        <VStack spacing={8}>
          <HStack spacing={8}>
            <Text font={{ size: 24, weight: 'heavy', design: 'default' }} foregroundStyle="#E0E0E0">
              {hoursDisplay}
            </Text>
            <Text font={{ size: 12, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              THIS WEEK
            </Text>
          </HStack>
          <StatusPill text={paceBadge} color={paceColor} />
          <Text font={{ size: 12, weight: 'medium', design: 'monospaced' }} foregroundStyle="#757575">
            {hoursRemaining}
          </Text>
        </VStack>
      </GlassCard>
    </ZStack>
  );

  const MediumWidget = () => (
    <ZStack>
      <Circle fill="#A78BFA40" blur={10} width={120} height={120} />
      <Circle fill="#00C2FF40" blur={10} width={100} height={100} />
      <GlassCard>
        <VStack spacing={12}>
          <HStack spacing={16}>
            <VStack spacing={4}>
              <Text font={{ size: 24, weight: 'heavy', design: 'default' }} foregroundStyle="#E0E0E0">
                {hoursDisplay}
              </Text>
              <Text font={{ size: 12, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
                THIS WEEK
              </Text>
            </VStack>
            <VStack spacing={4}>
              <Text font={{ size: 24, weight: 'heavy', design: 'default' }} foregroundStyle="#E8C97A">
                {earnings}
              </Text>
              <Text font={{ size: 12, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
                EARNED
              </Text>
            </VStack>
          </HStack>
          <StatusPill text={paceBadge} color={paceColor} />
          <Text font={{ size: 12, weight: 'medium', design: 'monospaced' }} foregroundStyle="#757575">
            {hoursRemaining}
          </Text>
        </VStack>
      </GlassCard>
    </ZStack>
  );

  const LargeWidget = () => (
    <ZStack>
      <Circle fill="#A78BFA40" blur={10} width={150} height={150} />
      <Circle fill="#00C2FF40" blur={10} width={120} height={120} />
      <GlassCard>
        <VStack spacing={16}>
          <HStack spacing={16}>
            <VStack spacing={4}>
              <Text font={{ size: 24, weight: 'heavy', design: 'default' }} foregroundStyle="#E0E0E0">
                {hoursDisplay}
              </Text>
              <Text font={{ size: 12, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
                THIS WEEK
              </Text>
            </VStack>
            <VStack spacing={4}>
              <Text font={{ size: 24, weight: 'heavy', design: 'default' }} foregroundStyle="#E8C97A">
                {earnings}
              </Text>
              <Text font={{ size: 12, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
                EARNED
              </Text>
            </VStack>
          </HStack>
          <StatusPill text={paceBadge} color={paceColor} />
          <Text font={{ size: 12, weight: 'medium', design: 'monospaced' }} foregroundStyle="#757575">
            {hoursRemaining}
          </Text>
          <BarChart daily={daily} />
          <HStack spacing={8}>
            <Text font={{ size: 12, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              TODAY:
            </Text>
            <Text font={{ size: 12, weight: 'medium', design: 'monospaced' }} foregroundStyle="#E0E0E0">
              {today}
            </Text>
            <Text font={{ size: 12, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              AI:
            </Text>
            <Text font={{ size: 12, weight: 'medium', design: 'monospaced' }} foregroundStyle="#00C2FF">
              {aiPct}
            </Text>
            <Text font={{ size: 12, weight: 'semibold', design: 'default' }} foregroundStyle="#A0A0A0">
              BRAINLIFT:
            </Text>
            <Text font={{ size: 12, weight: 'medium', design: 'monospaced' }} foregroundStyle="#A78BFA">
              {brainlift}
            </Text>
          </HStack>
        </VStack>
      </GlassCard>
    </ZStack>
  );

  return (
    <ZStack>
      {widgetData.size === 'systemSmall' && <SmallWidget />}
      {widgetData.size === 'systemMedium' && <MediumWidget />}
      {widgetData.size === 'systemLarge' && <LargeWidget />}
    </ZStack>
  );
});

export default HourglassWidget;
```
