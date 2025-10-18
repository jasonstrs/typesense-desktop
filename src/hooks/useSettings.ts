import { useState, useEffect } from 'react';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultPageSize: number;
  searchDebounceMs: number;
  autoRefreshCollections: boolean;
  autoRefreshInterval: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultPageSize: 25,
  searchDebounceMs: 500,
  autoRefreshCollections: false,
  autoRefreshInterval: 30,
};

// Custom event for settings updates within same window
const SETTINGS_UPDATED_EVENT = 'app-settings-updated';

export function triggerSettingsUpdate() {
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Initialize from localStorage
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (error) {
        console.error('Failed to parse settings:', error);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Listen for settings updates in same window
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (error) {
          console.error('Failed to parse settings:', error);
        }
      }
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
  }, []);

  // Listen for storage changes (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (error) {
          console.error('Failed to parse settings:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return settings;
}
