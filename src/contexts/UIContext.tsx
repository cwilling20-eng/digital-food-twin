import { createContext, useContext, useState, ReactNode } from 'react';

export interface QuickAddPrefill {
  mealName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface UIContextType {
  showQuickAdd: boolean;
  setShowQuickAdd: (show: boolean) => void;
  quickAddPrefill: QuickAddPrefill | null;
  openQuickAddWith: (prefill: QuickAddPrefill) => void;
  clearQuickAddPrefill: () => void;
  scanMode: 'goal' | 'enjoyment';
  setScanMode: (mode: 'goal' | 'enjoyment') => void;
  errorMessage: string | null;
  showError: (msg: string) => void;
  clearError: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddPrefill, setQuickAddPrefill] = useState<QuickAddPrefill | null>(null);
  const [scanMode, setScanMode] = useState<'goal' | 'enjoyment'>('goal');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openQuickAddWith = (prefill: QuickAddPrefill) => {
    setQuickAddPrefill(prefill);
    setShowQuickAdd(true);
  };

  const clearQuickAddPrefill = () => setQuickAddPrefill(null);

  const showError = (msg: string) => setErrorMessage(msg);
  const clearError = () => setErrorMessage(null);

  return (
    <UIContext.Provider value={{
      showQuickAdd, setShowQuickAdd,
      quickAddPrefill, openQuickAddWith, clearQuickAddPrefill,
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
