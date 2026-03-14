// FR5: Hours Dashboard Screen
// Primary contributor screen showing weekly hours, earnings, deadline countdown,
// daily bar chart, and urgency theming.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useConfig } from '@/src/hooks/useConfig';
import { useHoursData } from '@/src/hooks/useHoursData';
import NativeWindSmoke from '@/src/components/NativeWindSmoke';
import { StatCard } from '@/src/components/StatCard';
import { DailyBarChart } from '@/src/components/DailyBarChart';
import { UrgencyBanner } from '@/src/components/UrgencyBanner';

function formatHours(h: number): string {
  return h.toFixed(1) + 'h';
}

function formatCurrency(amount: number): string {
  return '$' + Math.round(amount).toLocaleString();
}

function formatCachedAt(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function HoursDashboard() {
  const router = useRouter();
  const { config } = useConfig();
  const { data, isLoading, isStale, cachedAt, error, refetch } = useHoursData();

  // Loading state — no data at all
  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00FF88" testID="loading-indicator" />
      </View>
    );
  }

  // Error state — no data and no cache
  if (error && !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load hours data.</Text>
        <Text style={styles.errorSubText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const weeklyLimit = config?.weeklyLimit ?? 40;
  const isOvertime = (data?.overtimeHours ?? 0) > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#00FF88"
        />
      }
    >
      {/* NativeWind smoke test — TEMPORARY: remove after verifying in Expo Go */}
      <NativeWindSmoke />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Hourglass</Text>
          {config?.useQA && (
            <View style={styles.qaBadge} testID="qa-badge">
              <Text style={styles.qaText}>QA</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/modal')}
          testID="settings-button"
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Block — total hours + weekly earnings */}
      <View style={styles.heroRow}>
        <View style={styles.heroCard} testID="hero-total-hours">
          <Text style={styles.heroLabel}>This Week</Text>
          <Text style={styles.heroValue}>{formatHours(data?.total ?? 0)}</Text>
        </View>
        <View style={styles.heroCard} testID="hero-weekly-earnings">
          <Text style={styles.heroLabel}>Earnings</Text>
          <Text style={styles.heroValue}>{formatCurrency(data?.weeklyEarnings ?? 0)}</Text>
        </View>
      </View>

      {/* Status Bar — hours remaining or overtime */}
      <View style={[styles.statusBar, isOvertime && styles.statusBarOvertime]}>
        {isOvertime ? (
          <Text style={styles.overtimeText}>
            {formatHours(data?.overtimeHours ?? 0)} overtime
          </Text>
        ) : (
          <Text style={styles.remainingText}>
            {formatHours(data?.hoursRemaining ?? 0)} remaining
          </Text>
        )}
        <Text style={styles.deadlineText}>
          Deadline: {data?.deadline
            ? new Date(data.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : '–'}
        </Text>
      </View>

      {/* Urgency Banner */}
      {data && <UrgencyBanner timeRemaining={data.timeRemaining} />}

      {/* Today Block */}
      <View style={styles.row}>
        <StatCard
          label="Today"
          value={formatHours(data?.today ?? 0)}
          subtitle={formatCurrency(data?.todayEarnings ?? 0)}
          testID="stat-today"
        />
        <StatCard
          label="Average"
          value={formatHours(data?.average ?? 0)}
          subtitle="per day"
          testID="stat-average"
        />
      </View>

      {/* Daily Bar Chart */}
      {data && data.daily.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionLabel}>This Week</Text>
          <DailyBarChart daily={data.daily} weeklyLimit={weeklyLimit} />
        </View>
      )}

      {/* Cache indicator */}
      {isStale && cachedAt && (
        <Text style={styles.cachedLabel}>
          Cached: {formatCachedAt(cachedAt)}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingTop: 56,
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qaBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  settingsIcon: {
    fontSize: 22,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heroCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
  },
  heroLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00FF88',
  },
  statusBar: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBarOvertime: {
    borderColor: '#FF9500',
    borderWidth: 1,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  overtimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  deadlineText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  chartContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cachedLabel: {
    fontSize: 12,
    color: '#FF9500',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#00FF88',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
