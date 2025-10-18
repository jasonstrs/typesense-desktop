import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  selectedCollectionForDocuments: string | null;
  setSelectedCollectionForDocuments: (collection: string | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [selectedCollectionForDocuments, setSelectedCollectionForDocuments] = useState<
    string | null
  >(null);

  return (
    <NavigationContext.Provider
      value={{ selectedCollectionForDocuments, setSelectedCollectionForDocuments }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
