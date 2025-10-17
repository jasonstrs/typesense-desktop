import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Layout } from './components/Layout/Layout';
import { ConnectionsView } from './views/ConnectionsView';
import { CollectionsView } from './views/CollectionsView';
import { SearchView } from './views/SearchView';
import { SettingsView } from './views/SettingsView';
import { Toaster } from './components/ui/sonner';

function App() {
  const [activeView, setActiveView] = useState('connections');

  const renderView = () => {
    switch (activeView) {
      case 'connections':
        return <ConnectionsView />;
      case 'collections':
        return <CollectionsView />;
      case 'search':
        return <SearchView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ConnectionsView />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Layout activeView={activeView} onViewChange={setActiveView}>
        {renderView()}
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
