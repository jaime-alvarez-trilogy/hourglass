// FR7, FR8, FR9, FR10: Config/credentials storage + environment helpers

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { CrossoverConfig, Credentials } from '../types/config';

const CONFIG_KEY = 'crossover_config';
const USERNAME_KEY = 'crossover_username';
const PASSWORD_KEY = 'crossover_password';

// FR10: Environment base URLs
export function getApiBase(useQA: boolean): string {
  return useQA ? 'https://api-qa.crossover.com' : 'https://api.crossover.com';
}

export function getAppBase(useQA: boolean): string {
  return useQA ? 'https://app-qa.crossover.com' : 'https://app.crossover.com';
}

// FR7: AsyncStorage config layer
export async function loadConfig(): Promise<CrossoverConfig | null> {
  const raw = await AsyncStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CrossoverConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(config: CrossoverConfig): Promise<void> {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// FR8: SecureStore credentials layer
export async function loadCredentials(): Promise<Credentials | null> {
  const [username, password] = await Promise.all([
    SecureStore.getItemAsync(USERNAME_KEY),
    SecureStore.getItemAsync(PASSWORD_KEY),
  ]);
  if (!username || !password) return null;
  return { username, password };
}

export async function saveCredentials(username: string, password: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(USERNAME_KEY, username),
    SecureStore.setItemAsync(PASSWORD_KEY, password),
  ]);
}

// FR9: Clear all stored data
export async function clearAll(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(CONFIG_KEY),
    SecureStore.deleteItemAsync(USERNAME_KEY),
    SecureStore.deleteItemAsync(PASSWORD_KEY),
  ]);
}
