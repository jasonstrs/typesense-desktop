import { Settings } from 'lucide-react';

export function SettingsView() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Settings view coming soon</h3>
        <p className="text-muted-foreground">
          App preferences and configuration options will be available here
        </p>
      </div>
    </div>
  );
}
