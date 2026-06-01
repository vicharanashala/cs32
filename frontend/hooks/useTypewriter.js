'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const TYPING_SPEED = 50;
const DELETING_SPEED = 30;
const PAUSE_AFTER_TYPING = 2000;
const PAUSE_AFTER_DELETING = 500;

const SEARCH_PLACEHOLDERS = [
  'Ask a question you have doubts about...',
  'Search existing questions and answers...',
  'Find answers in the FAQs section...',
  'Look up topics by tags...',
  'Check if your question was already answered...',
  'Browse questions by category...',
  'Find an expert answer to your problem...',
];

export function useTypewriter() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState('typing');
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const currentPhrase = SEARCH_PLACEHOLDERS[currentIndex];

  const clearTypingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    clearTypingInterval();
  }, [clearTypingInterval]);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    clearTypingInterval();

    const tick = () => {
      setCharIndex(prev => {
        const current = prev;

        if (phase === 'typing') {
          if (current < currentPhrase.length) {
            setDisplayText(currentPhrase.slice(0, current + 1));
            return current + 1;
          } else {
            setPhase('pauseAfterType');
            return current;
          }
        } else if (phase === 'pauseAfterType') {
          setPhase('deleting');
          return current;
        } else if (phase === 'deleting') {
          if (current > 0) {
            setDisplayText(currentPhrase.slice(0, current - 1));
            return current - 1;
          } else {
            setPhase('pauseAfterDelete');
            return current;
          }
        } else if (phase === 'pauseAfterDelete') {
          setCurrentIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
          setPhase('typing');
          return 0;
        }
        return current;
      });
    };

    let delay;
    switch (phase) {
      case 'typing':
        delay = TYPING_SPEED;
        break;
      case 'pauseAfterType':
        delay = PAUSE_AFTER_TYPING;
        break;
      case 'deleting':
        delay = DELETING_SPEED;
        break;
      case 'pauseAfterDelete':
        delay = PAUSE_AFTER_DELETING;
        break;
      default:
        delay = TYPING_SPEED;
    }

    intervalRef.current = setInterval(tick, delay);

    return clearTypingInterval;
  }, [phase, isPaused, currentPhrase, clearTypingInterval]);

  return { text: displayText, pause, resume, isPaused };
}