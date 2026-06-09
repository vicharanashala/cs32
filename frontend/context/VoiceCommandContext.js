import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

// Context to control the global voice activation and opening of the search modal
const VoiceCommandContext = createContext({
  openSearch: () => {},
  closeSearch: () => {},
  isSearchOpen: false,
});

export const useVoiceCommand = () => useContext(VoiceCommandContext);

export const VoiceCommandProvider = ({ children }) => {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const recognitionRef = useRef(null);

  const openSearch = () => {
    setSearchOpen(true);
    setAutoStart(true);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setAutoStart(false);
  };

  useEffect(() => {
    // Only start the global recognizer if the API exists
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    const activationPhrase = /prashna\s*sarathi\s*activate/i;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (activationPhrase.test(transcript)) {
        openSearch();
      }
    };
    recognition.onerror = (e) => {
      console.error('Global voice command error', e);
      toast.error('Voice command error');
    };
    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  return (
    <VoiceCommandContext.Provider value={{ openSearch, closeSearch, isSearchOpen, autoStart }}>
      {children}
    </VoiceCommandContext.Provider>
  );
};
