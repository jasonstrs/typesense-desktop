export interface Connection {
  id: string;
  name: string;
  url: string;
  // API key is stored securely in keyring, not here
}

export interface ConnectionWithKey extends Connection {
  apiKey: string;
}
