import { invoke } from '@tauri-apps/api/core';
import { load } from '@tauri-apps/plugin-store';

const SERVICE_NAME = 'typesense-desktop';

// Fallback storage for API keys when keychain fails
let apiKeyStore: Awaited<ReturnType<typeof load>> | null = null;

async function getApiKeyStore() {
  if (!apiKeyStore) {
    apiKeyStore = await load('api-keys.json', { autoSave: false });
  }
  return apiKeyStore;
}

/**
 * Store an API key securely in the OS keychain (with fallback to encrypted store)
 */
export async function setApiKey(connectionId: string, apiKey: string): Promise<void> {
  console.log('Storing API key for connection:', connectionId);

  // Always store in fallback as well (keychain is unreliable on macOS in dev mode)
  const store = await getApiKeyStore();
  await store.set(connectionId, apiKey);
  await store.save();
  console.log('API key stored in fallback storage');

  try {
    // Also try keychain
    await invoke('keyring_set', {
      service: SERVICE_NAME,
      account: connectionId,
      password: apiKey,
    });
    console.log('API key also stored in keychain');
  } catch (error) {
    console.warn('Keychain storage failed (fallback already saved):', error);
  }
}

/**
 * Retrieve an API key from the OS keychain (with fallback to encrypted store)
 */
export async function getApiKey(connectionId: string): Promise<string> {
  console.log('Retrieving API key for connection:', connectionId);

  // Try fallback first (more reliable)
  const store = await getApiKeyStore();
  const key = await store.get<string>(connectionId);
  if (key) {
    console.log('API key retrieved from fallback storage');
    return key;
  }

  // Try keychain as backup
  try {
    const keychainKey = await invoke('keyring_get', {
      service: SERVICE_NAME,
      account: connectionId,
    });
    console.log('API key retrieved from keychain');
    return keychainKey as string;
  } catch (error) {
    console.error('Failed to retrieve API key from both fallback and keychain');
    throw new Error('API key not found');
  }
}

/**
 * Delete an API key from the OS keychain (and fallback storage)
 */
export async function deleteApiKey(connectionId: string): Promise<void> {
  try {
    await invoke('keyring_delete', {
      service: SERVICE_NAME,
      account: connectionId,
    });
  } catch (error) {
    console.warn('Keychain delete failed, trying fallback');
  }

  // Also delete from fallback
  try {
    const store = await getApiKeyStore();
    await store.delete(connectionId);
    await store.save();
  } catch (error) {
    console.warn('Fallback delete failed:', error);
  }
}
