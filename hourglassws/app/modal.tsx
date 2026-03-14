import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { clearAll, loadConfig, saveConfig } from '@/src/store/config';
import { useConfig } from '@/src/hooks/useConfig';

export default function ModalScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { config } = useConfig();

  async function handleSignOut() {
    Alert.alert('Sign Out', 'This will clear your saved credentials and return to the login screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          queryClient.setQueryData(['config'], null);
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  }

  async function toggleShowApprovals(value: boolean) {
    if (!config) return;
    const updated = { ...config, showApprovals: value };
    await saveConfig(updated);
    queryClient.setQueryData(['config'], updated);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {config && (
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>Config Debug</Text>
          <Text style={styles.debugRow}>name: {config.fullName}</Text>
          <Text style={styles.debugRow}>userId: {config.userId}</Text>
          <Text style={styles.debugRow}>managerId: {config.managerId}</Text>
          <Text style={styles.debugRow}>teamId: {config.primaryTeamId}</Text>
          <Text style={styles.debugRow}>assignmentId: {config.assignmentId}</Text>
          <Text style={styles.debugRow}>rate: ${config.hourlyRate}/hr</Text>
          <Text style={styles.debugRow}>isManager: {String(config.isManager)}</Text>
          <Text style={styles.debugRow}>env: {config.useQA ? 'QA' : 'Production'}</Text>
        </View>
      )}

      {/* Dev options — always visible since this is a debug settings screen */}
      {config && (
        <View style={styles.devBox}>
          <Text style={styles.devTitle}>Dev Options</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show Approvals Tab</Text>
            <Switch
              value={config.showApprovals ?? false}
              onValueChange={toggleShowApprovals}
              trackColor={{ false: '#2A2A3D', true: '#E8C97A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.toggleHint}>
            {config.isManager
              ? 'You are a manager — Approvals tab is always shown.'
              : 'Enable to show the Approvals tab for testing (non-manager account).'}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    padding: 24,
    paddingTop: 40,
  },
  debugBox: {
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00FF88',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  debugRow: {
    fontSize: 13,
    color: '#8B949E',
    fontFamily: 'Courier',
  },
  devBox: {
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
    gap: 4,
  },
  devTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8C97A',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  toggleHint: {
    fontSize: 12,
    color: '#484F58',
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#F85149',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F85149',
  },
});
