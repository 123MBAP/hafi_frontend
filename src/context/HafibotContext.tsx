import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HafibotContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openHafibot: () => void;
  closeHafibot: () => void;
  toggleHafibot: () => void;
}

const HafibotContext = createContext<HafibotContextType | undefined>(undefined);

export const HafibotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openHafibot = () => setIsOpen(true);
  const closeHafibot = () => setIsOpen(false);
  const toggleHafibot = () => setIsOpen(prev => !prev);

  return (
    <HafibotContext.Provider
      value={{
        isOpen,
        setIsOpen,
        openHafibot,
        closeHafibot,
        toggleHafibot,
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
    };
  }
  return context;
};
