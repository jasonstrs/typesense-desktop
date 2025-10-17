import Typesense from 'typesense';
import type { Client } from 'typesense';

let client: Client | null = null;

/**
 * Initialize Typesense client with connection details
 */
export function initializeClient(url: string, apiKey: string): Client {
  // Parse the URL to extract host and port
  const urlObj = new URL(url);
  const host = urlObj.hostname;
  const portString = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
  const port = parseInt(portString, 10);
  const protocol = urlObj.protocol.replace(':', '') as 'http' | 'https';

  console.log('Initializing Typesense client:', { host, port, protocol, url });

  client = new Typesense.Client({
    nodes: [
      {
        host,
        port,
        protocol,
      },
    ],
    apiKey,
    connectionTimeoutSeconds: 10,
  });

  return client;
}

/**
 * Get the current Typesense client instance
 */
export function getClient(): Client {
  if (!client) {
    throw new Error('Typesense client not initialized. Please connect to a server first.');
  }
  return client;
}

/**
 * Clear the current client connection
 */
export function clearClient(): void {
  client = null;
}

/**
 * Test if a connection is valid
 */
export async function testConnection(url: string, apiKey: string): Promise<boolean> {
  try {
    const testClient = initializeClient(url, apiKey);
    await testClient.health.retrieve();
    return true;
  } catch {
    return false;
  }
}
