import { create } from 'zustand';
import type { Connection } from '@/types/connection';
import {
  getConnections,
  addConnection as addConnectionToStorage,
  updateConnection as updateConnectionInStorage,
  deleteConnection as deleteConnectionFromStorage,
  getActiveConnectionId,
  setActiveConnectionId,
} from '@/services/storage';
import {
  setApiKey,
  getApiKey,
  deleteApiKey,
  setSearchApiKey,
  getSearchApiKey,
  deleteSearchApiKey,
} from '@/services/keyring';

interface ConnectionStore {
  connections: Connection[];
  activeConnectionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadConnections: () => Promise<void>;
  addConnection: (
    connection: Connection,
    apiKey: string,
    searchApiKey?: string
  ) => Promise<void>;
  updateConnection: (
    connectionId: string,
    updates: Partial<Connection>,
    apiKey?: string,
    searchApiKey?: string
  ) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
  setActiveConnection: (connectionId: string | null) => Promise<void>;
  getConnectionApiKey: (connectionId: string) => Promise<string>;
  getConnectionSearchApiKey: (connectionId: string) => Promise<string>;
  testConnection: (url: string, apiKey: string) => Promise<boolean>;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  isLoading: false,
  error: null,

  loadConnections: async () => {
    set({ isLoading: true, error: null });
    try {
      const connections = await getConnections();
      const activeId = await getActiveConnectionId();
      set({ connections, activeConnectionId: activeId, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addConnection: async (connection, apiKey, searchApiKey) => {
    console.log('Adding connection:', connection.id, 'with API key');
    set({ isLoading: true, error: null });
    try {
      console.log('Saving connection to storage...');
      await addConnectionToStorage(connection);
      console.log('Connection saved to storage, now saving API key...');
      await setApiKey(connection.id, apiKey);
      if (searchApiKey) {
        console.log('Saving search API key...');
        await setSearchApiKey(connection.id, searchApiKey);
      }
      console.log('API key saved, setting as active connection...');
      await setActiveConnectionId(connection.id);
      console.log('API key saved, reloading connections...');
      const connections = await getConnections();
      set({ connections, activeConnectionId: connection.id, isLoading: false });
      console.log('Connection added successfully and set as active');
    } catch (error) {
      console.error('Error adding connection:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateConnection: async (connectionId, updates, apiKey, searchApiKey) => {
    set({ isLoading: true, error: null });
    try {
      await updateConnectionInStorage(connectionId, updates);
      if (apiKey) {
        await setApiKey(connectionId, apiKey);
      }
      if (searchApiKey !== undefined) {
        if (searchApiKey) {
          await setSearchApiKey(connectionId, searchApiKey);
        } else {
          await deleteSearchApiKey(connectionId);
        }
      }
      const connections = await getConnections();
      set({ connections, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteConnection: async (connectionId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteConnectionFromStorage(connectionId);
      await deleteApiKey(connectionId);
      await deleteSearchApiKey(connectionId);
      const connections = await getConnections();
      const { activeConnectionId } = get();

      // If we deleted the active connection, clear it
      if (activeConnectionId === connectionId) {
        await setActiveConnectionId(null);
        set({ connections, activeConnectionId: null, isLoading: false });
      } else {
        set({ connections, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setActiveConnection: async (connectionId) => {
    set({ isLoading: true, error: null });
    try {
      await setActiveConnectionId(connectionId);
      set({ activeConnectionId: connectionId, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  getConnectionApiKey: async (connectionId) => {
    return await getApiKey(connectionId);
  },

  getConnectionSearchApiKey: async (connectionId) => {
    // Try to get search-specific key first, fall back to admin key
    const searchKey = await getSearchApiKey(connectionId);
    if (searchKey) {
      return searchKey;
    }
    return await getApiKey(connectionId);
  },

  testConnection: async (url, apiKey) => {
    try {
      // Simple test: try to fetch Typesense health endpoint
      const response = await fetch(`${url}/health`, {
        headers: {
          'X-TYPESENSE-API-KEY': apiKey,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
}));
