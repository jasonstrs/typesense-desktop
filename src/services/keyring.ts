import { invoke } from '@tauri-apps/api/core';

const SERVICE_NAME = 'typesense-desktop';
const SEARCH_KEY_SUFFIX = '-search';

/**
 * Store an API key securely in the OS keychain
 * - macOS: Keychain
 * - Windows: Credential Manager
 * - Linux: Secret Service (libsecret)
 */
export async function setApiKey(connectionId: string, apiKey: string): Promise<void> {
  await invoke('keyring_set', {
    service: SERVICE_NAME,
    account: connectionId,
    password: apiKey,
  });
}

/**
 * Store a search-only API key securely in the OS keychain
 * This is optional and used for better security - search operations will use this key if available
 */
export async function setSearchApiKey(connectionId: string, searchApiKey: string): Promise<void> {
  await invoke('keyring_set', {
    service: SERVICE_NAME,
    account: `${connectionId}${SEARCH_KEY_SUFFIX}`,
    password: searchApiKey,
  });
}

/**
 * Retrieve an API key from the OS keychain
 * - macOS: Keychain
 * - Windows: Credential Manager
 * - Linux: Secret Service (libsecret)
 */
export async function getApiKey(connectionId: string): Promise<string> {
  const key = await invoke<string>('keyring_get', {
    service: SERVICE_NAME,
    account: connectionId,
  });
  return key;
}

/**
 * Retrieve a search-only API key from the OS keychain
 * Returns null if no search key is configured (falls back to admin key)
 */
export async function getSearchApiKey(connectionId: string): Promise<string | null> {
  try {
    const key = await invoke<string>('keyring_get', {
      service: SERVICE_NAME,
      account: `${connectionId}${SEARCH_KEY_SUFFIX}`,
    });
    return key;
  } catch {
    // Search key not found - this is OK, we'll fall back to admin key
    return null;
  }
}

/**
 * Delete an API key from the OS keychain
 * - macOS: Keychain
 * - Windows: Credential Manager
 * - Linux: Secret Service (libsecret)
 */
export async function deleteApiKey(connectionId: string): Promise<void> {
  await invoke('keyring_delete', {
    service: SERVICE_NAME,
    account: connectionId,
  });
}

/**
 * Delete a search API key from the OS keychain
 */
export async function deleteSearchApiKey(connectionId: string): Promise<void> {
  try {
    await invoke('keyring_delete', {
      service: SERVICE_NAME,
      account: `${connectionId}${SEARCH_KEY_SUFFIX}`,
    });
  } catch {
    // Key doesn't exist, that's OK
  }
}
