import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HafibotContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openHafibot: (prompt?: string) => void;
  closeHafibot: () => void;
  toggleHafibot: () => void;
  pendingPrompt: string | null;
  clearPendingPrompt: () => void;
}

const HafibotContext = createContext<HafibotContextType | undefined>(undefined);

export const HafibotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const openHafibot = (prompt?: string) => {
    if (prompt) {
      setPendingPrompt(prompt);
    }
    setIsOpen(true);
  };
  const closeHafibot = () => setIsOpen(false);
  const toggleHafibot = () => setIsOpen(prev => !prev);
  const clearPendingPrompt = () => setPendingPrompt(null);

  return (
    <HafibotContext.Provider
      value={{
        isOpen,
        setIsOpen,
        openHafibot,
        closeHafibot,
        toggleHafibot,
        pendingPrompt,
        clearPendingPrompt,
      }}
    >
      {children}
    </HafibotContext.Provider>
  );
};

export const useHafibot = (): HafibotContextType => {
  const context = useContext(HafibotContext);
  if (!context) {
    // Safe fallback if used outside provider
    return {
      isOpen: false,
      setIsOpen: () => {},
      openHafibot: () => {},
      closeHafibot: () => {},
      toggleHafibot: () => {},
      pendingPrompt: null,
      clearPendingPrompt: () => {},
    };
  }
  return context;
};
