import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { NavigationProvider } from './contexts/NavigationContext';
import { ThemeProvider } from './components/theme-provider';
import { Layout } from './components/Layout/Layout';
import { ConnectionsView } from './views/ConnectionsView';
import { CollectionsView } from './views/CollectionsView';
import { DocumentsView } from './views/DocumentsView';
import { SettingsView } from './views/SettingsView';
import { Toaster } from './components/ui/sonner';

function App() {
  const [activeView, setActiveView] = useState('connections');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NavigationProvider>
          <Layout activeView={activeView} onViewChange={setActiveView}>
            <div style={{ display: activeView === 'connections' ? 'block' : 'none' }}>
              <ConnectionsView />
            </div>
            <div style={{ display: activeView === 'collections' ? 'block' : 'none' }}>
              <CollectionsView onViewChange={setActiveView} />
            </div>
            <div style={{ display: activeView === 'documents' ? 'block' : 'none' }}>
              <DocumentsView />
            </div>
            <div style={{ display: activeView === 'settings' ? 'block' : 'none' }}>
              <SettingsView />
            </div>
          </Layout>
          <Toaster />
        </NavigationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
