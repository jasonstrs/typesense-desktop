import { load } from '@tauri-apps/plugin-store';
import type { Connection } from '@/types/connection';

let store: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!store) {
    store = await load('settings.json', { autoSave: false, defaults: {} });
  }
  return store;
}

const CONNECTIONS_KEY = 'connections';
const ACTIVE_CONNECTION_KEY = 'activeConnectionId';

/**
 * Get all saved connections
 */
export async function getConnections(): Promise<Connection[]> {
  const s = await getStore();
  const connections = await s.get<Connection[]>(CONNECTIONS_KEY);
  return connections || [];
}

/**
 * Save connections to store
 */
export async function saveConnections(connections: Connection[]): Promise<void> {
  const s = await getStore();
  await s.set(CONNECTIONS_KEY, connections);
  await s.save();
}

/**
 * Add a new connection
 */
export async function addConnection(connection: Connection): Promise<void> {
  const connections = await getConnections();
  connections.push(connection);
  await saveConnections(connections);
}

/**
 * Update an existing connection
 */
export async function updateConnection(
  connectionId: string,
  updates: Partial<Connection>
): Promise<void> {
  const connections = await getConnections();
  const index = connections.findIndex((c) => c.id === connectionId);
  if (index !== -1) {
    connections[index] = { ...connections[index], ...updates };
    await saveConnections(connections);
  }
}

/**
 * Delete a connection
 */
export async function deleteConnection(connectionId: string): Promise<void> {
  const connections = await getConnections();
  const filtered = connections.filter((c) => c.id !== connectionId);
  await saveConnections(filtered);
}

/**
 * Get the active connection ID
 */
export async function getActiveConnectionId(): Promise<string | null> {
  const s = await getStore();
  return (await s.get<string>(ACTIVE_CONNECTION_KEY)) || null;
}

/**
 * Set the active connection ID
 */
export async function setActiveConnectionId(connectionId: string | null): Promise<void> {
  const s = await getStore();
  await s.set(ACTIVE_CONNECTION_KEY, connectionId);
  await s.save();
}

/**
 * Get the active connection
 */
export async function getActiveConnection(): Promise<Connection | null> {
  const activeId = await getActiveConnectionId();
  if (!activeId) return null;

  const connections = await getConnections();
  return connections.find((c) => c.id === activeId) || null;
}
