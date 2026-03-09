// FR7: Success screen — confirm onboarding complete, persist credentials, navigate to tabs
import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useOnboarding } from '@/src/contexts/OnboardingContext';
import { saveConfig, saveCredentials } from '@/src/store/config';

export default function SuccessScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pendingConfig, pendingCredentials } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fullName = pendingConfig?.fullName ?? '';
  const isManager = pendingConfig?.isManager ?? false;
  const hourlyRate = pendingConfig?.hourlyRate ?? 0;

  // SC7.4: both writes must succeed before navigation (SC7.5)
  async function handleGoToDashboard() {
    if (saving || !pendingConfig || !pendingCredentials) return;
    setSaving(true);
    setSaveError(null);
    try {
      const finalConfig = { ...pendingConfig, setupComplete: true };
      await saveCredentials(pendingCredentials.username, pendingCredentials.password);
      await saveConfig(finalConfig);
      // Update React Query cache immediately so auth gate sees setupComplete: true
      queryClient.setQueryData(['config'], finalConfig);
      router.replace('/(tabs)');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.check}>✓</Text>
        <Text style={styles.title}>{fullName}</Text>
        <Text style={styles.role}>{isManager ? 'Manager' : 'Contributor'}</Text>
        <Text style={styles.rate}>${hourlyRate} / hr</Text>
      </View>

      {saveError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{saveError}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.cta, saving && styles.ctaDisabled]}
        onPress={handleGoToDashboard}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#0D1117" />
        ) : (
          <Text style={styles.ctaText}>Go to Dashboard</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', padding: 24, justifyContent: 'space-between' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 48, color: '#00FF88' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 16, textAlign: 'center' },
  role: { fontSize: 16, color: '#8B949E', marginTop: 8 },
  rate: { fontSize: 24, fontWeight: '600', color: '#00FF88', marginTop: 12 },
  errorBanner: { backgroundColor: '#3D1A1A', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#F85149', marginBottom: 16 },
  errorBannerText: { color: '#F85149', fontSize: 14 },
  cta: { backgroundColor: '#00FF88', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#0D1117' },
});
