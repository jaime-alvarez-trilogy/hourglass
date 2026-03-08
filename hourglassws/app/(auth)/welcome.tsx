// FR2: Welcome screen — environment selector + "Get Started" CTA
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/src/contexts/OnboardingContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setEnvironment } = useOnboarding();
  const [useQA, setUseQA] = useState(false);

  function handleEnvSelect(qa: boolean) {
    setUseQA(qa);
    setEnvironment(qa);
  }

  function handleGetStarted() {
    router.push('/(auth)/credentials');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hourglass</Text>
        <Text style={styles.subtitle}>Crossover Time Tracker</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>Environment</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.option, !useQA && styles.selected]}
            onPress={() => handleEnvSelect(false)}
          >
            <Text style={[styles.optionText, !useQA && styles.selectedText]}>
              Production
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, useQA && styles.selected]}
            onPress={() => handleEnvSelect(true)}
          >
            <Text style={[styles.optionText, useQA && styles.selectedText]}>
              QA (Testing)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.cta} onPress={handleGetStarted}>
        <Text style={styles.ctaText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', justifyContent: 'space-between', padding: 32 },
  header: { alignItems: 'center', marginTop: 60 },
  title: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#8B949E', marginTop: 8 },
  body: { flex: 1, justifyContent: 'center' },
  label: { fontSize: 14, color: '#8B949E', marginBottom: 12 },
  toggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#30363D' },
  option: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#161B22' },
  selected: { backgroundColor: '#00FF88' },
  optionText: { fontSize: 15, fontWeight: '500', color: '#8B949E' },
  selectedText: { color: '#0D1117' },
  cta: { backgroundColor: '#00FF88', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#0D1117' },
});
