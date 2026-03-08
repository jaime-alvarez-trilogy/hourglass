// In-memory mock for expo-secure-store
const store: Record<string, string> = {};

const SecureStore = {
  getItemAsync: jest.fn(async (key: string): Promise<string | null> => {
    return store[key] ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string): Promise<void> => {
    store[key] = value;
  }),
  deleteItemAsync: jest.fn(async (key: string): Promise<void> => {
    delete store[key];
  }),
  // Reset all state and mock implementations between tests
  _reset: () => {
    Object.keys(store).forEach((k) => delete store[k]);
    SecureStore.getItemAsync.mockClear();
    SecureStore.setItemAsync.mockClear();
    SecureStore.deleteItemAsync.mockClear();
    // Restore default implementations
    SecureStore.getItemAsync.mockImplementation(async (key: string) => store[key] ?? null);
    SecureStore.setItemAsync.mockImplementation(async (key: string, value: string) => {
      store[key] = value;
    });
    SecureStore.deleteItemAsync.mockImplementation(async (key: string) => {
      delete store[key];
    });
  },
};

export default SecureStore;
export { SecureStore };
