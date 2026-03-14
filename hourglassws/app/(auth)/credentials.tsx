// FR3: Credentials screen — email + password form with validation
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/src/contexts/OnboardingContext';

export default function CredentialsScreen() {
  const router = useRouter();
  const { submitCredentials, setEnvironment, isLoading, error, step } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useQA, setUseQA] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  function handleEnvSelect(qa: boolean) {
    setUseQA(qa);
    setEnvironment(qa);
  }

  // Navigate when step transitions away from credentials
  useEffect(() => {
    if (step === 'verifying') {
      router.push('/(auth)/verifying');
    }
  }, [step]);

  function validate(): boolean {
    let valid = true;
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else {
      setEmailError('');
    }
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  }

  async function handleSignIn() {
    Keyboard.dismiss();
    if (!validate()) return;
    await submitCredentials(email.trim(), password);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-4 pt-12 pb-4 justify-between" style={{ flexGrow: 1 }}>
          {/* Header */}
          <View className="mb-6">
            <Text className="font-display-semibold text-3xl text-textPrimary">Sign In</Text>
            <Text className="font-body text-base text-textSecondary mt-1">
              Enter your Crossover credentials
            </Text>
          </View>

          {/* Error banner */}
          {error ? (
            <View className="bg-surface border border-critical rounded-xl p-4 mb-4">
              <Text className="font-sans text-sm text-critical">{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="flex-1 gap-1">
            <Text className="font-sans-medium text-sm text-textSecondary mb-1">Email</Text>
            <TextInput
              className={`bg-surface border rounded-xl px-4 py-3 font-sans text-base text-textPrimary ${
                emailError ? 'border-critical' : emailFocused ? 'border-gold' : 'border-border'
              }`}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@crossover.com"
              placeholderTextColor="#484F58"
              editable={!isLoading}
              returnKeyType="next"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              onSubmitEditing={() => {/* password field next */}}
            />
            {emailError ? (
              <Text className="font-sans text-sm text-critical mt-1">{emailError}</Text>
            ) : null}

            <Text className="font-sans-medium text-sm text-textSecondary mb-1 mt-5">Password</Text>
            <TextInput
              className={`bg-surface border rounded-xl px-4 py-3 font-sans text-base text-textPrimary ${
                passwordError ? 'border-critical' : passwordFocused ? 'border-gold' : 'border-border'
              }`}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#484F58"
              editable={!isLoading}
              returnKeyType="done"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              onSubmitEditing={handleSignIn}
            />
            {passwordError ? (
              <Text className="font-sans text-sm text-critical mt-1">{passwordError}</Text>
            ) : null}

            <Text className="font-sans text-xs text-textMuted mt-3">
              Forgot your password? Reset it at crossover.com
            </Text>

            {/* Environment toggle */}
            <Text className="font-sans-medium text-sm text-textSecondary mb-1 mt-7">Environment</Text>
            <View className="flex-row rounded-xl overflow-hidden border border-border">
              <TouchableOpacity
                className={`flex-1 py-3 items-center ${!useQA ? 'bg-gold' : 'bg-surface'}`}
                onPress={() => handleEnvSelect(false)}
              >
                <Text className={`font-sans-medium text-sm ${!useQA ? 'text-background' : 'text-textSecondary'}`}>
                  Production
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 items-center ${useQA ? 'bg-gold' : 'bg-surface'}`}
                onPress={() => handleEnvSelect(true)}
              >
                <Text className={`font-sans-medium text-sm ${useQA ? 'text-background' : 'text-textSecondary'}`}>
                  QA (Testing)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In CTA */}
          <TouchableOpacity
            className={`bg-gold rounded-xl py-4 items-center mt-8 ${isLoading ? 'opacity-60' : ''}`}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#8B949E" />
            ) : (
              <Text className="font-sans-semibold text-base text-background">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
