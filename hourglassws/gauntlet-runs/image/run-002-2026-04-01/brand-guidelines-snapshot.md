BRAND_GUIDELINES.md:
# Hourglass Brand Guidelines v2.0
**Spatial Dark Glass UI — Strict Implementation Reference**

COLOR SYSTEM:
- background: #0D0C14 (deep eggplant void)
- surface: #16151F (glass card fill)
- surfaceElevated: #1F1E29 (modals)
- border: #2F2E41
- textPrimary: #E0E0E0 (NEVER #FFFFFF)
- textSecondary: #A0A0A0
- textMuted: #757575
- gold: #E8C97A (earnings ONLY)
- goldBright: #FFDF89 (Crushed It peak ONLY)
- cyan: #00C2FF (AI metrics ONLY)
- violet: #A78BFA (BrainLift, primary CTAs)
- success: #10B981 (on-track hours)
- warning: #F59E0B (behind pace)
- critical: #F43F5E (critical pace)
- destructive: #F85149

PANEL STATES (background glow color):
- on_track: #10B981 success green
- crushed_it: #FFDF89 gold peak
- behind: #F59E0B warning orange
- critical: #F43F5E critical red
- none/idle: violet/cyan mesh default

TYPOGRAPHY:
- Hero numbers: Space Grotesk Bold (font weight 'heavy' in SwiftUI)
- Labels: Inter Medium uppercase (font weight 'semibold' in SwiftUI)
- Data/timestamps: Space Mono

WIDGET TECHNICAL CONSTRAINTS (CRITICAL):
- This is expo-widgets (@expo/ui/swift-ui) — compiles to SwiftUI, NOT React Native
- Available primitives ONLY: VStack, HStack, ZStack, Text, Spacer, Rectangle, RoundedRectangle, Circle
- NO NativeWind, NO Reanimated, NO TouchableOpacity, NO View, NO StyleSheet
- Colors passed as hex strings directly to fill/foregroundStyle/stroke props
- Font specified as: font={{ size: N, weight: 'heavy'|'bold'|'semibold'|'medium'|'regular', design: 'monospaced'|'default' }}
- Padding as: padding={N} or padding={{ top, bottom, leading, trailing }}
- Spacing in stacks: spacing={N}
- Blur on Circle: blur={N}
- Stroke on RoundedRectangle: stroke="color" strokeWidth={N}
- ZStack layers back-to-front
- Use Circle with blur for ambient glow effects (like the app's mesh background)
- Use RoundedRectangle for glass cards (fill with semi-transparent dark color)

GLASS CARD PATTERN for widget:
  <ZStack>
    <RoundedRectangle fill="#16151FCC" cornerRadius={16} />  // dark glass 80%
    <RoundedRectangle cornerRadius={16} stroke="#A78BFA40" strokeWidth={1} />  // violet border
    <VStack padding={14} alignment="leading">
      {children}
    </VStack>
  </ZStack>

BAR CHART PATTERN:
- Past bars: #4A4A6A (muted purple-grey)
- Today's bar: accent color (matches pace state)
- Future bars: #2F2E41 (dark muted)
- Bar height proportional to hours vs max hours in week
- Day labels: 10px muted grey

STATUS → ACCENT COLOR MAPPING:
- none (on track): #10B981 success green
- low (slightly behind): #F59E0B warning
- high (critical): #F43F5E critical red
- critical: #F43F5E
- expired: #757575

DATA FIELDS AVAILABLE (WidgetData):
- hoursDisplay: string (e.g. "22.3h")
- earnings: string (e.g. "$1,117")
- hoursRemaining: string (e.g. "17.7h left")
- paceBadge: 'on_track'|'crushed_it'|'behind'|'critical'
- urgency: 'none'|'low'|'high'|'critical'|'expired'
- aiPct: string (e.g. "74%–78%")
- brainlift: string (e.g. "3.2h")
- today: string (e.g. "+5.0h")
- todayDelta: string (e.g. "+0.0h")
- weekDeltaEarnings: string
- pendingCount: number
- isManager: boolean
- daily: WidgetDailyEntry[] — [{day:'Mon'|'Tue'..., hours:N, isToday:boolean, isFuture:boolean}]
- cachedAt: number (timestamp)
- approvalItems: [{id,name,hours,category}]

DESIGN GOALS FOR THIS GAUNTLET:
1. Match app's premium dark glass aesthetic — the widget currently looks too generic/flat
2. Use proper brand colors throughout (see semantic color mapping above)
3. Background should have ambient glow circles (like the app's mesh) using Circle+blur
4. Glass cards should feel like the app's GlassCard component
5. Earnings should use gold (#E8C97A), AI% should use cyan (#00C2FF), BrainLift violet (#A78BFA)
6. Status pill should be prominent and styled with accent color fill + border
7. Bar chart bars: gradient feel using color contrast (today = bright accent, past = muted, future = dark)
8. Typography hierarchy: large hero numbers, small uppercase labels
9. All three sizes (small/medium/large) should be cohesive

TAILWIND CONFIG (for reference — note: NOT used in widgets, colors only):
FONT_FAMILIES: display=SpaceGrotesk_700Bold, mono=SpaceMono_400Regular, sans=Inter_400Regular

REANIMATED PRESETS (NOT used in widgets — reference only):
springSnappy, springBouncy, springPremium, timingChartFill, timingSmooth, timingInstant
