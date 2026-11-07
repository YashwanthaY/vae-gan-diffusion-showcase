import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'generative_display_mode';

export default function useViewMode(defaultMode = 'images') {
  const [mode, setModeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'images' || saved === 'graphs') {
        return saved;
      }
    } catch (e) {
      // localStorage not accessible or disabled
    }
    return defaultMode;
  });

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (e) {}
  }, []);

  const toggleMode = useCallback(() => {
    setMode(prev => (prev === 'images' ? 'graphs' : 'images'));
  }, [setMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input, textarea or contenteditable element
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        toggleMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode]);

  return [mode, setMode, toggleMode];
}
