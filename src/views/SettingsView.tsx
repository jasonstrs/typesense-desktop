import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultPageSize: number;
  searchDebounceMs: number;
  autoRefreshCollections: boolean;
  autoRefreshInterval: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultPageSize: 25,
  searchDebounceMs: 500,
  autoRefreshCollections: false,
  autoRefreshInterval: 30,
};

export function SettingsView() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to parse settings:', error);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    setHasChanges(false);
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    toast.info('Settings reset to defaults (click Save to apply)');
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your Typesense Desktop preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Customize how the application looks
            </p>
          </div>

          <hr className="border-t" />

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) => updateSetting('theme', value as any)}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color theme
            </p>
          </div>
        </div>

        {/* Data Display Section */}
        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Data Display</h2>
            <p className="text-sm text-muted-foreground">
              Control how data is displayed in lists and tables
            </p>
          </div>

          <hr className="border-t" />

          <div className="space-y-2">
            <Label htmlFor="pageSize">Default Page Size</Label>
            <Select
              value={settings.defaultPageSize.toString()}
              onValueChange={(value) => updateSetting('defaultPageSize', parseInt(value))}
            >
              <SelectTrigger id="pageSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 items</SelectItem>
                <SelectItem value="25">25 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
                <SelectItem value="100">100 items</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Number of items to show per page in Documents and Search views
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Search</h2>
            <p className="text-sm text-muted-foreground">
              Configure search behavior
            </p>
          </div>

          <hr className="border-t" />

          <div className="space-y-2">
            <Label htmlFor="debounce">Search Debounce (ms)</Label>
            <Input
              id="debounce"
              type="number"
              min="0"
              max="2000"
              step="100"
              value={settings.searchDebounceMs}
              onChange={(e) =>
                updateSetting('searchDebounceMs', parseInt(e.target.value) || 0)
              }
            />
            <p className="text-xs text-muted-foreground">
              Delay in milliseconds before triggering search after typing stops
            </p>
          </div>
        </div>

        {/* Data Refresh Section */}
        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Data Refresh</h2>
            <p className="text-sm text-muted-foreground">
              Control automatic data refreshing
            </p>
          </div>

          <hr className="border-t" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoRefresh">Auto-refresh Collections</Label>
              <p className="text-xs text-muted-foreground">
                Automatically refresh collection list periodically
              </p>
            </div>
            <input
              id="autoRefresh"
              type="checkbox"
              className="w-4 h-4"
              checked={settings.autoRefreshCollections}
              onChange={(e) => updateSetting('autoRefreshCollections', e.target.checked)}
            />
          </div>

          {settings.autoRefreshCollections && (
            <div className="space-y-2">
              <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
              <Input
                id="refreshInterval"
                type="number"
                min="10"
                max="300"
                step="10"
                value={settings.autoRefreshInterval}
                onChange={(e) =>
                  updateSetting('autoRefreshInterval', parseInt(e.target.value) || 30)
                }
              />
              <p className="text-xs text-muted-foreground">
                How often to refresh data (minimum 10 seconds)
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        {hasChanges && (
          <p className="text-sm text-muted-foreground">
            You have unsaved changes. Click "Save Changes" to apply them.
          </p>
        )}
      </div>
    </div>
  );
}
