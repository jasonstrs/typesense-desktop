export interface Connection {
  id: string;
  name: string;
  url: string;
  // API keys are stored securely in keyring, not here
  // Supports both admin and search keys for better security
}

export interface ConnectionWithKey extends Connection {
  apiKey: string;
  searchApiKey?: string; // Optional: use separate key for search operations
}
