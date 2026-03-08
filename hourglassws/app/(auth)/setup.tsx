// FR6: Setup screen — manual rate fallback when auto-detect fails
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useOnboarding } from '@/src/contexts/OnboardingContext';

export default function SetupScreen() {
  const { submitRate, isLoading, error } = useOnboarding();
  const [rateText, setRateText] = useState('');
  const [rateError, setRateError] = useState('');

  async function handleContinue() {
    const rate = parseFloat(rateText);
    if (!rateText || !rate || rate <= 0) {
      setRateError('Please enter a valid hourly rate greater than 0');
      return;
    }
    setRateError('');
    await submitRate(rate);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Your Rate</Text>
        <Text style={styles.subtitle}>
          We couldn't detect your rate automatically. Please enter it below.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <Text style={styles.label}>Your hourly rate (USD)</Text>
        <TextInput
          style={[styles.input, rateError ? styles.inputError : null]}
          value={rateText}
          onChangeText={setRateText}
          keyboardType="decimal-pad"
          placeholder="e.g. 50"
          placeholderTextColor="#484F58"
          editable={!isLoading}
        />
        {rateError ? <Text style={styles.fieldError}>{rateError}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.cta, isLoading && styles.ctaDisabled]}
        onPress={handleContinue}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#0D1117" />
        ) : (
          <Text style={styles.ctaText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', padding: 24, justifyContent: 'space-between' },
  header: { marginTop: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 15, color: '#8B949E', marginTop: 8 },
  errorBanner: { backgroundColor: '#3D1A1A', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#F85149' },
  errorBannerText: { color: '#F85149', fontSize: 14 },
  form: { flex: 1, marginTop: 24 },
  label: { fontSize: 13, color: '#8B949E', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#30363D', borderRadius: 8, padding: 14, fontSize: 20, color: '#FFFFFF', backgroundColor: '#161B22' },
  inputError: { borderColor: '#F85149' },
  fieldError: { color: '#F85149', fontSize: 12, marginTop: 4 },
  cta: { backgroundColor: '#00FF88', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#0D1117' },
});
