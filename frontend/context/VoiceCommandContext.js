'use client';
import React, { createContext, useContext, useState } from 'react';

// Context to control the search modal state and voice-trigger start state
const VoiceCommandContext = createContext({
  openSearch: () => {},
  closeSearch: () => {},
  isSearchOpen: false,
  autoStart: false,
});

export const useVoiceCommand = () => useContext(VoiceCommandContext);

export const VoiceCommandProvider = ({ children }) => {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [autoStart, setAutoStart] = useState(false);

  const openSearch = (startListening = false) => {
    setSearchOpen(true);
    setAutoStart(startListening);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setAutoStart(false);
  };

  return (
    <VoiceCommandContext.Provider value={{ openSearch, closeSearch, isSearchOpen, autoStart }}>
      {children}
    </VoiceCommandContext.Provider>
  );
};
