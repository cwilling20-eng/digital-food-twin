import { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  showQuickAdd: boolean;
  setShowQuickAdd: (show: boolean) => void;
  scanMode: 'goal' | 'enjoyment';
  setScanMode: (mode: 'goal' | 'enjoyment') => void;
  errorMessage: string | null;
  showError: (msg: string) => void;
  clearError: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [scanMode, setScanMode] = useState<'goal' | 'enjoyment'>('goal');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = (msg: string) => setErrorMessage(msg);
  const clearError = () => setErrorMessage(null);

  return (
    <UIContext.Provider value={{
      showQuickAdd, setShowQuickAdd,
      scanMode, setScanMode,
      errorMessage, showError, clearError,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
