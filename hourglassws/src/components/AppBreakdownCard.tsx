// AppBreakdownCard — 12-app-breakdown-ui FR3
// Card displaying per-app AI vs non-AI slot breakdown with guidance chips.
//
// Layout:
//   Card (borderAccentColor=violet)
//   └─ SectionLabel "APP BREAKDOWN"
//   └─ App rows: [appName] [AppUsageBar] [N slots]
//   └─ Guidance section (omitted when guidance=[])
//      └─ [colored dot] [chip text]
//
// Returns null when entries=[].

import React from 'react';
import { View, Text } from 'react-native';
import Card from './Card';
import SectionLabel from './SectionLabel';
import AppUsageBar from './AppUsageBar';
import { colors } from '@/src/lib/colors';
import type { AppBreakdownEntry } from '@/src/lib/aiAppBreakdown';
import type { GuidanceChip } from '@/src/lib/appGuidance';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppBreakdownCardProps {
  /** Aggregated 12w entries, already sorted by total slots desc. Max 8 shown. */
  entries: AppBreakdownEntry[];
  /** 0–3 guidance chips from generateGuidance(). */
  guidance: GuidanceChip[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppBreakdownCard({ entries, guidance }: AppBreakdownCardProps): JSX.Element | null {
  if (entries.length === 0) return null;

  return (
    <Card borderAccentColor={colors.violet}>
      <SectionLabel className="mb-3">APP BREAKDOWN</SectionLabel>

      {/* App rows */}
      <View style={{ gap: 8 }}>
        {entries.map(entry => {
          const slotCount = entry.aiSlots + entry.nonAiSlots;
          return (
            <View
              key={entry.appName}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              {/* App name */}
              <Text
                style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {entry.appName}
              </Text>

              {/* Usage bar — flex fill */}
              <View style={{ flex: 2 }}>
                <AppUsageBar
                  aiSlots={entry.aiSlots}
                  brainliftSlots={entry.brainliftSlots}
                  nonAiSlots={entry.nonAiSlots}
                  height={4}
                />
              </View>

              {/* Slot count */}
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 11,
                  width: 52,
                  textAlign: 'right',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {slotCount} slots
              </Text>
            </View>
          );
        })}
      </View>

      {/* Guidance chips — omitted when empty */}
      {guidance.length > 0 && (
        <View style={{ marginTop: 12, gap: 6 }}>
          {guidance.map((chip, idx) => (
            <View
              key={idx}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
            >
              {/* Colored dot */}
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: chip.color,
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              {/* Chip text */}
              <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 17 }}>
                {chip.text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
