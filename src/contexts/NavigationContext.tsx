import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  selectedCollectionForDocuments: string | null;
  setSelectedCollectionForDocuments: (collection: string | null) => void;
  selectedCollection: string | null;
  setSelectedCollection: (collection: string | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [selectedCollectionForDocuments, setSelectedCollectionForDocuments] = useState<
    string | null
  >(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  return (
    <NavigationContext.Provider
      value={{
        selectedCollectionForDocuments,
        setSelectedCollectionForDocuments,
        selectedCollection,
        setSelectedCollection,
      }}
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
