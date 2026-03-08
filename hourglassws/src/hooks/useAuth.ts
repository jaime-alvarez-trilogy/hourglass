// FR8: useSetup — onboarding state machine hook

import { useState, useRef } from 'react';
import { fetchAndBuildConfig } from '../api/auth';
import { AuthError, NetworkError } from '../api/errors';
import type { CrossoverConfig } from '../types/config';

export type OnboardingStep = 'welcome' | 'credentials' | 'verifying' | 'setup' | 'success';

export interface UseSetupResult {
  step: OnboardingStep;
  setEnvironment: (useQA: boolean) => void;
  submitCredentials: (username: string, password: string) => Promise<void>;
  submitRate: (rate: number) => Promise<void>;
  pendingConfig: CrossoverConfig | null;
  pendingCredentials: { username: string; password: string } | null;
  isLoading: boolean;
  error: string | null;
}

export function useSetup(): UseSetupResult {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfig, setPendingConfig] = useState<CrossoverConfig | null>(null);
  const [pendingCredentials, setPendingCredentials] = useState<{ username: string; password: string } | null>(null);
  const useQARef = useRef(false);

  function setEnvironment(useQA: boolean): void {
    useQARef.current = useQA;
  }

  async function submitCredentials(username: string, password: string): Promise<void> {
    if (isLoading) return; // SC8.6: no-op if in flight

    setIsLoading(true);
    setError(null);
    setStep('verifying'); // SC8.4: synchronous step transition

    try {
      const config = await fetchAndBuildConfig(username, password, useQARef.current);
      setPendingConfig(config);
      setPendingCredentials({ username, password });

      if (config.hourlyRate === 0) {
        setStep('setup');
      } else {
        setStep('success');
      }
    } catch (err) {
      setStep('credentials');
      if (err instanceof AuthError) {
        setError('Invalid email or password.');
      } else if (err instanceof NetworkError) {
        setError('Connection failed. Please check your network and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function submitRate(rate: number): Promise<void> {
    if (!pendingConfig) return;

    setIsLoading(true);
    setError(null);
    try {
      setPendingConfig({ ...pendingConfig, hourlyRate: rate });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rate.');
    } finally {
      setIsLoading(false);
    }
  }

  return {
    step,
    setEnvironment,
    submitCredentials,
    submitRate,
    pendingConfig,
    pendingCredentials,
    isLoading,
    error,
  };
}
