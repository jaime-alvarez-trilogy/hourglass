// FR4: Verifying screen — non-interactive loading while auth + profile fetch runs
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/src/contexts/OnboardingContext';

export default function VerifyingScreen() {
  const router = useRouter();
  const { step } = useOnboarding();

  // SC4.3–4.5: Navigate automatically when step leaves 'verifying'
  useEffect(() => {
    if (step === 'success') {
      router.replace('/(auth)/success');
    } else if (step === 'setup') {
      router.replace('/(auth)/setup');
    } else if (step === 'credentials') {
      router.replace('/(auth)/credentials');
    }
  }, [step, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00FF88" />
      <Text style={styles.label}>Verifying your account…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center', gap: 20 },
  label: { fontSize: 16, color: '#8B949E' },
});
