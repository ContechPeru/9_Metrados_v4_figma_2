import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  sidebarExpanded: boolean;
  setSidebarExpanded: (v: boolean) => void;
  rightPanelVisible: boolean;
  setRightPanelVisible: (v: boolean) => void;
  bdMode: 'oficial' | 'pc';
  setBdMode: (v: 'oficial' | 'pc') => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [bdMode, setBdMode] = useState<'oficial' | 'pc'>('oficial');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(p => p + 1);

  return (
    <AppContext.Provider value={{
      sidebarExpanded, setSidebarExpanded,
      rightPanelVisible, setRightPanelVisible,
      bdMode, setBdMode,
      refreshTrigger, triggerRefresh
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
