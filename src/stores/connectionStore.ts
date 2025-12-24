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
import { setApiKey, getApiKey, deleteApiKey } from '@/services/keyring';
import { initializeClient, clearClient } from '@/services/typesense';
import { queryClient } from '@/lib/queryClient';

interface ConnectionStore {
  connections: Connection[];
  activeConnectionId: string | null;
  isClientReady: boolean;
  isLoading: boolean;
  error: string | null;
  isReadOnly: boolean;

  // Actions
  loadConnections: () => Promise<void>;
  addConnection: (connection: Connection, apiKey: string) => Promise<void>;
  updateConnection: (
    connectionId: string,
    updates: Partial<Connection>,
    apiKey?: string
  ) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
  setActiveConnection: (connectionId: string | null) => Promise<void>;
  getConnectionApiKey: (connectionId: string) => Promise<string>;
  testConnection: (url: string, apiKey: string) => Promise<boolean>;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  isClientReady: false,
  isLoading: false,
  error: null,
  isReadOnly: false,

  loadConnections: async () => {
    set({ isLoading: true, error: null });
    try {
      const connections = await getConnections();
      const activeId = await getActiveConnectionId();

      // Initialize client for active connection
      let isClientReady = false;
      let isReadOnly = false;
      if (activeId) {
        const activeConnection = connections.find((c) => c.id === activeId);
        if (activeConnection) {
          isReadOnly = activeConnection.readOnly || false;
          try {
            const apiKey = await getApiKey(activeId);
            initializeClient(activeConnection.url, apiKey);
            isClientReady = true;
          } catch (error) {
            console.error('Failed to initialize client for active connection:', error);
          }
        }
      }

      set({
        connections,
        activeConnectionId: activeId,
        isClientReady,
        isReadOnly,
        isLoading: false
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addConnection: async (connection, apiKey) => {
    console.log('Adding connection:', connection.id, 'with API key');
    set({ isLoading: true, error: null });
    try {
      console.log('Saving connection to storage...');
      await addConnectionToStorage(connection);
      console.log('Connection saved to storage, now saving API key...');
      await setApiKey(connection.id, apiKey);
      console.log('API key saved, setting as active connection...');
      await setActiveConnectionId(connection.id);
      console.log('Initializing Typesense client...');
      initializeClient(connection.url, apiKey);
      const connections = await getConnections();
      set({
        connections,
        activeConnectionId: connection.id,
        isClientReady: true,
        isReadOnly: connection.readOnly || false,
        isLoading: false
      });
      console.log('Connection added successfully and set as active');
    } catch (error) {
      console.error('Error adding connection:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateConnection: async (connectionId, updates, apiKey) => {
    set({ isLoading: true, error: null });
    try {
      await updateConnectionInStorage(connectionId, updates);
      if (apiKey) {
        await setApiKey(connectionId, apiKey);
      }
      const connections = await getConnections();
      const { activeConnectionId } = get();

      // If updating the active connection, reinitialize client and invalidate all queries
      if (connectionId === activeConnectionId) {
        const connection = connections.find((c) => c.id === connectionId);
        if (connection) {
          const key = apiKey || await getApiKey(connectionId);
          initializeClient(connection.url, key);
          // Invalidate all queries to refresh data with new connection settings
          queryClient.invalidateQueries();
          set({
            connections,
            isClientReady: true,
            isReadOnly: connection.readOnly || false,
            isLoading: false
          });
        } else {
          set({ connections, isLoading: false });
        }
      } else {
        set({ connections, isLoading: false });
      }
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
      const connections = await getConnections();
      const { activeConnectionId } = get();

      // If we deleted the active connection, clear it and the client
      if (activeConnectionId === connectionId) {
        await setActiveConnectionId(null);
        clearClient();
        // Invalidate all queries since the active connection was deleted
        queryClient.invalidateQueries();
        set({
          connections,
          activeConnectionId: null,
          isClientReady: false,
          isReadOnly: false,
          isLoading: false
        });
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

      // Clear all query caches when switching connections
      queryClient.invalidateQueries();

      // Initialize client for the new active connection
      let isClientReady = false;
      let isReadOnly = false;
      if (connectionId) {
        const { connections } = get();
        const connection = connections.find((c) => c.id === connectionId);
        if (connection) {
          isReadOnly = connection.readOnly || false;
          try {
            const apiKey = await getApiKey(connectionId);
            initializeClient(connection.url, apiKey);
            isClientReady = true;
          } catch (error) {
            console.error('Failed to initialize client for connection:', error);
          }
        }
      } else {
        clearClient();
      }

      set({
        activeConnectionId: connectionId,
        isClientReady,
        isReadOnly,
        isLoading: false
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  getConnectionApiKey: async (connectionId) => {
    return await getApiKey(connectionId);
  },

  testConnection: async (url, apiKey) => {
    try {
      // Test with /collections endpoint which requires authentication
      const response = await fetch(`${url}/collections`, {
        headers: {
          'X-TYPESENSE-API-KEY': apiKey,
        },
      });
      // Return true only if we get a 200 OK response
      // 401 means bad API key, other errors mean connection issues
      return response.status === 200;
    } catch {
      return false;
    }
  },
}));
