// FR2: Welcome screen — splash + Get Started CTA
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hourglass</Text>
        <Text style={styles.subtitle}>Crossover Time Tracker</Text>
      </View>

      <TouchableOpacity style={styles.cta} onPress={() => router.push('/(auth)/credentials')}>
        <Text style={styles.ctaText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', justifyContent: 'space-between', padding: 32 },
  header: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#8B949E', marginTop: 8 },
  cta: { backgroundColor: '#00FF88', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#0D1117' },
});
