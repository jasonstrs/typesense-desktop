import { invoke } from '@tauri-apps/api/core';

const SERVICE_NAME = 'typesense-desktop';

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
